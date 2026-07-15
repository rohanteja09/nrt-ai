import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isQuotaExhausted } from "@/lib/quota";
import { getUsage, visitorKey } from "@/lib/rateLimit";

export async function GET(req: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const deviceId = req.headers.get("x-nrt-device");
  const visitor = visitorKey(ip, deviceId);
  const [exhausted, usage] = await Promise.all([
    isQuotaExhausted(env.RATE_LIMIT_KV),
    getUsage(env.RATE_LIMIT_KV, visitor),
  ]);
  return Response.json({ exhausted, usage });
}
