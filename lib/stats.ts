export interface PublicStats {
  chatsToday: number;
  imagesToday: number;
  chatsAllTime: number;
  imagesAllTime: number;
}

async function bumpCounter(kv: KVNamespace, key: string, ttlSeconds?: number) {
  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;
  await kv.put(key, String(count + 1), ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Separate from the per-visitor rate-limit counters in rateLimit.ts — those
// exist to cap one visitor's usage, these exist purely to show an aggregate
// "how much is this thing used" number on the public /stats page.
export async function recordChat(kv: KVNamespace): Promise<void> {
  await Promise.all([
    bumpCounter(kv, `agg:chats:${today()}`, 60 * 60 * 24 * 2),
    bumpCounter(kv, "agg:chats:alltime"),
  ]);
}

export async function recordImage(kv: KVNamespace): Promise<void> {
  await Promise.all([
    bumpCounter(kv, `agg:images:${today()}`, 60 * 60 * 24 * 2),
    bumpCounter(kv, "agg:images:alltime"),
  ]);
}

export async function getPublicStats(kv: KVNamespace): Promise<PublicStats> {
  const [chatsToday, imagesToday, chatsAllTime, imagesAllTime] = await Promise.all([
    kv.get(`agg:chats:${today()}`),
    kv.get(`agg:images:${today()}`),
    kv.get("agg:chats:alltime"),
    kv.get("agg:images:alltime"),
  ]);
  return {
    chatsToday: chatsToday ? parseInt(chatsToday, 10) : 0,
    imagesToday: imagesToday ? parseInt(imagesToday, 10) : 0,
    chatsAllTime: chatsAllTime ? parseInt(chatsAllTime, 10) : 0,
    imagesAllTime: imagesAllTime ? parseInt(imagesAllTime, 10) : 0,
  };
}
