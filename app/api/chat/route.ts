import { getCloudflareContext } from "@opennextjs/cloudflare";
import { runAgent, routeMessage, streamPlainReply } from "@/lib/agent";
import { checkChatLimit, getUsage, visitorKey } from "@/lib/rateLimit";
import { isQuotaError, markQuotaExhausted, QUOTA_MESSAGE } from "@/lib/quota";
import { recordChat } from "@/lib/stats";

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
  await recordChat(env.RATE_LIMIT_KV);

  // Real streaming only applies to the plain-chat "none" route — anything
  // that might need a tool falls back to the existing non-streamed flow,
  // which needs the complete response to parse out tool_calls.
  let route: Awaited<ReturnType<typeof routeMessage>> = "none";
  if (!image) {
    const lastUserMessage = messages[messages.length - 1]?.content ?? "";
    route = await routeMessage(env, lastUserMessage);
  }

  if (!image && route === "none") {
    try {
      const stream = await streamPlainReply(env, messages);
      const usage = await getUsage(env.RATE_LIMIT_KV, visitor);
      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache",
          "x-nrt-usage": JSON.stringify(usage),
        },
      });
    } catch (err) {
      console.error(err);
      if (isQuotaError(err)) {
        await markQuotaExhausted(env.RATE_LIMIT_KV);
        return Response.json({ error: QUOTA_MESSAGE, quotaExhausted: true }, { status: 503 });
      }
      return Response.json({ error: "Something went wrong talking to the AI backend." }, { status: 500 });
    }
  }

  try {
    const result = await runAgent(env, messages, visitor, image, route);
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
