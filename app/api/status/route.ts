import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isQuotaExhausted } from "@/lib/quota";

export async function GET() {
  const { env } = await getCloudflareContext({ async: true });
  const exhausted = await isQuotaExhausted(env.RATE_LIMIT_KV);
  return Response.json({ exhausted });
}
