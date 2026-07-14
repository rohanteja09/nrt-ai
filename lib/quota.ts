const QUOTA_KEY = "quota-exhausted";

/** Matches Workers AI's account-level daily allocation errors, not per-visitor limits. */
export function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /neuron|allocation|daily.*(limit|quota)|quota.*exceeded|capacity|3040/i.test(msg);
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(60, Math.ceil((next - now.getTime()) / 1000));
}

export async function markQuotaExhausted(kv: KVNamespace): Promise<void> {
  await kv.put(QUOTA_KEY, "1", { expirationTtl: secondsUntilUtcMidnight() });
}

export async function isQuotaExhausted(kv: KVNamespace): Promise<boolean> {
  return (await kv.get(QUOTA_KEY)) !== null;
}

export const QUOTA_MESSAGE =
  "NRT AI has hit its free daily capacity — come back tomorrow! (The free AI budget resets at midnight UTC.)";
