import { getCloudflareContext } from "@opennextjs/cloudflare";
import { clearMemories, getMemories } from "@/lib/memory";
import { visitorKey } from "@/lib/rateLimit";

function getVisitor(req: Request): string {
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const deviceId = req.headers.get("x-nrt-device");
  return visitorKey(ip, deviceId);
}

export async function GET(req: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const memories = await getMemories(env.RATE_LIMIT_KV, getVisitor(req));
  return Response.json({ memories });
}

export async function DELETE(req: Request) {
  const { env } = await getCloudflareContext({ async: true });
  await clearMemories(env.RATE_LIMIT_KV, getVisitor(req));
  return Response.json({ ok: true });
}
