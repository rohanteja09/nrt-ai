const MAX_MEMORIES = 20;
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days — long enough to be useful, bounded so KV doesn't grow forever

function key(visitor: string): string {
  return `memory:${visitor}`;
}

export async function getMemories(kv: KVNamespace, visitor: string): Promise<string[]> {
  const raw = await kv.get(key(visitor));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((f): f is string => typeof f === "string") : [];
  } catch {
    return [];
  }
}

export async function addMemory(kv: KVNamespace, visitor: string, fact: string): Promise<void> {
  const trimmed = fact.trim();
  if (!trimmed) return;
  const existing = await getMemories(kv, visitor);
  const next = [...existing, trimmed].slice(-MAX_MEMORIES);
  await kv.put(key(visitor), JSON.stringify(next), { expirationTtl: TTL_SECONDS });
}

export async function clearMemories(kv: KVNamespace, visitor: string): Promise<void> {
  await kv.delete(key(visitor));
}
