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

// IP alone under-counts distinct visitors behind shared NAT (same WiFi,
// carrier-grade NAT on mobile networks, offices) — everyone there gets one
// pooled quota. Folding in a client-generated device ID (persisted in
// localStorage, sent as the x-nrt-device header) gives each browser its own
// bucket while still falling back to pure-IP grouping if the header is
// absent, so older/no-JS clients degrade to the previous shared behavior.
export function visitorKey(ip: string, deviceId: string | null): string {
  return deviceId ? `${ip}:${deviceId}` : ip;
}

export async function checkChatLimit(kv: KVNamespace, visitor: string): Promise<boolean> {
  return bump(kv, `chat:${visitor}:${today()}`, DAILY_CHAT_LIMIT);
}

// Split into a peek (read-only) and a commit (actually spends the slot),
// instead of one atomic check-and-increment — image generation can fail
// (content moderation, upstream errors), and a failed attempt shouldn't
// cost the visitor part of their daily quota. Only call commitImageUsage
// after generateImage() has actually succeeded.
export async function peekImageAllowed(kv: KVNamespace, visitor: string): Promise<boolean> {
  const usage = await getUsage(kv, visitor);
  return usage.imagesLeft > 0;
}

export async function commitImageUsage(kv: KVNamespace, visitor: string): Promise<void> {
  const key = `image:${visitor}:${today()}`;
  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;
  await kv.put(key, String(count + 1), { expirationTtl: 60 * 60 * 24 });
}

export async function getUsage(kv: KVNamespace, visitor: string): Promise<Usage> {
  const [chat, image] = await Promise.all([
    kv.get(`chat:${visitor}:${today()}`),
    kv.get(`image:${visitor}:${today()}`),
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
