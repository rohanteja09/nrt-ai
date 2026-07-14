const DAILY_CHAT_LIMIT = 30;
const DAILY_IMAGE_LIMIT = 8;

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
