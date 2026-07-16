import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getPublicStats } from "@/lib/stats";

export async function GET() {
  const { env } = await getCloudflareContext({ async: true });
  const stats = await getPublicStats(env.RATE_LIMIT_KV);
  return Response.json(stats);
}
