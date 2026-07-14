export const DAILY_CHAT_LIMIT = 30;
export const DAILY_IMAGE_LIMIT = 8;

export interface Usage {
  chatsLeft: number;
  chatLimit: number;
  imagesLeft: number;
  imageLimit: number;
}

async function bump(kv: KVNamespace, key: string, limit: number): Promise<boolean> {
  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;
  if (count >= limit) return false;
  await kv.put(key, String(count + 1), { expirationTtl: 60 * 60 * 24 });
  return true;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function checkChatLimit(kv: KVNamespace, ip: string): Promise<boolean> {
  return bump(kv, `chat:${ip}:${today()}`, DAILY_CHAT_LIMIT);
}

export async function checkImageLimit(kv: KVNamespace, ip: string): Promise<boolean> {
  return bump(kv, `image:${ip}:${today()}`, DAILY_IMAGE_LIMIT);
}

export async function getUsage(kv: KVNamespace, ip: string): Promise<Usage> {
  const [chat, image] = await Promise.all([
    kv.get(`chat:${ip}:${today()}`),
    kv.get(`image:${ip}:${today()}`),
  ]);
  const chatUsed = chat ? parseInt(chat, 10) : 0;
  const imageUsed = image ? parseInt(image, 10) : 0;
  return {
    chatsLeft: Math.max(0, DAILY_CHAT_LIMIT - chatUsed),
    chatLimit: DAILY_CHAT_LIMIT,
    imagesLeft: Math.max(0, DAILY_IMAGE_LIMIT - imageUsed),
    imageLimit: DAILY_IMAGE_LIMIT,
  };
}
