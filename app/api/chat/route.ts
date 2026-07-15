import { getCloudflareContext } from "@opennextjs/cloudflare";
import { runAgent } from "@/lib/agent";
import { checkChatLimit, getUsage, visitorKey } from "@/lib/rateLimit";
import { isQuotaError, markQuotaExhausted, QUOTA_MESSAGE } from "@/lib/quota";

interface ChatRequestBody {
  messages?: { role: "user" | "assistant"; content: string }[];
  image?: { dataUrl: string; question: string };
}

export async function POST(req: Request) {
  const { env } = await getCloudflareContext({ async: true });

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { messages, image } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages array is required." }, { status: 400 });
  }

  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const deviceId = req.headers.get("x-nrt-device");
  const visitor = visitorKey(ip, deviceId);
  const allowed = await checkChatLimit(env.RATE_LIMIT_KV, visitor);
  if (!allowed) {
    const usage = await getUsage(env.RATE_LIMIT_KV, visitor);
    return Response.json(
      { error: "Daily free-tier limit reached for this visitor. Please try again tomorrow.", usage },
      { status: 429 }
    );
  }

  try {
    const result = await runAgent(env, messages, visitor, image);
    const usage = await getUsage(env.RATE_LIMIT_KV, visitor);
    return Response.json({ ...result, usage });
  } catch (err) {
    console.error(err);
    if (isQuotaError(err)) {
      await markQuotaExhausted(env.RATE_LIMIT_KV);
      return Response.json({ error: QUOTA_MESSAGE, quotaExhausted: true }, { status: 503 });
    }
    return Response.json({ error: "Something went wrong talking to the AI backend." }, { status: 500 });
  }
}
