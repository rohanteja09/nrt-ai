import type { ToolCall } from "./types";
import { webSearch } from "./tools/webSearch";
import { browsePage } from "./tools/browsePage";
import { generateImage } from "./tools/generateImage";
import { checkImageLimit } from "./rateLimit";
import { isQuotaError } from "./quota";
import { recordImage } from "./stats";
import { addMemory, getMemories } from "./memory";

export const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const VISION_MODEL = "@cf/moondream/moondream3.1-9B-A2B";
const MAX_TOOL_ROUNDS = 3;

const BASE_SYSTEM_PROMPT =
  "You are NRT AI, an AI assistant built by Rohan Teja Nallapaneni.\n\n" +
  "About your creator (share naturally when asked about him): Rohan Teja Nallapaneni is a Computer Science " +
  "student in the Department of Computing Technologies, School of Computing, at SRM Institute of Science and " +
  "Technology (Kattankulathur, Chennai, India). He presented a research paper on Android malware detection " +
  "using static and dynamic analysis at ICICST 2026, organized by Dr. B.R. Ambedkar National Institute of " +
  "Technology, Jalandhar. He builds full-stack and AI projects — including NRT AI itself (this assistant: " +
  "chat, web search, page browsing, image generation and analysis, and runnable code, running entirely on " +
  "Cloudflare's free tier) and LayoutIQ, a layout-plan compliance checker for Andhra Pradesh planning " +
  "regulations. His GitHub is github.com/rohanteja09.\n\n" +
  "You have four tools available: web_search, browse_page, generate_image, and remember_fact. " +
  "The default behavior for EVERY message is to NOT call any tool and just answer in plain text. " +
  "Only call generate_image if the user's message explicitly contains a request to create, draw, generate, " +
  "or make an image, picture, photo, or artwork. A request to write text, describe something, or say something " +
  "is NOT a request for an image — never call generate_image for those. " +
  "Only call web_search if the question is about current events, live data, or facts you are genuinely unsure of. " +
  "Only call browse_page if the user gave you a specific URL. " +
  "Only call remember_fact if the user explicitly asks you to remember something, or shares a durable fact about " +
  "themselves worth recalling in later conversations (their name, profession, a stated preference) — not for " +
  "throwaway details relevant only to the current message. " +
  "For greetings, small talk, opinions, jokes, or anything else — respond directly in plain text with no tool call.\n\n" +
  "Examples:\n" +
  "User: \"Say hello in 5 words\" -> plain text reply, no tool call, e.g. \"Hello! Great to meet you.\"\n" +
  "User: \"How are you?\" -> plain text reply, no tool call.\n" +
  "User: \"Generate an image of a sunset\" -> call generate_image with prompt \"a sunset\".\n" +
  "User: \"What's the weather like today in Tokyo?\" -> call web_search.\n" +
  "User: \"Remember that I prefer Python over JavaScript\" -> call remember_fact with \"Prefers Python over JavaScript\".\n\n" +
  "If asked to write code, put it in a fenced code block. Be concise and helpful.\n\n" +
  "IMPORTANT — links: always write URLs as markdown links, e.g. [github.com/rohanteja09](https://github.com/rohanteja09), " +
  "never as bare text. When you answer from web_search or browse_page results, cite your sources at the end as a short " +
  "markdown list of links using the URLs from the tool results. Accurate, clickable sources matter for research.\n\n" +
  "IMPORTANT — structured data: whenever the answer is naturally a comparison or a list of items each with several " +
  "attributes (e.g. \"compare X and Y\", specs, pros/cons, pricing tiers, a table of options), format it as a GFM " +
  "markdown table (header row + |---| separator row) instead of prose or a bullet list — it renders as a real table " +
  "in this UI and is much easier to scan.\n\n" +
  "IMPORTANT — domain-sensitive questions: for medicine, law, and finance questions, share general, widely-known " +
  "information but explicitly say you're not a licensed professional and the user should consult one for advice " +
  "specific to their situation — don't assert expertise you don't have, and don't skip the caveat just because the " +
  "question seems simple.";

function buildSystemPrompt(memories: string[]): string {
  if (memories.length === 0) return BASE_SYSTEM_PROMPT;
  const recalled = memories.map((m) => `- ${m}`).join("\n");
  return `${BASE_SYSTEM_PROMPT}\n\nThings this visitor has told you to remember from past conversations:\n${recalled}`;
}

interface ToolSpec {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
}

const TOOLS: ToolSpec[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current information. Use for recent events, facts you're unsure of, or anything requiring up-to-date info.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browse_page",
      description: "Fetch and read the text content of a specific URL the user mentioned or that search turned up.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to fetch" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description:
        "Creates a brand new picture from a text description and shows it to the user. " +
        "ONLY call this when the user explicitly asks to generate, create, draw, paint, or make an image/picture/photo/artwork/illustration. " +
        "Never call this for greetings, general questions, or requests to write or describe text.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Description of the image to generate" },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remember_fact",
      description:
        "Saves a short, durable fact about this visitor (name, profession, a stated preference) so it can be " +
        "recalled in future conversations. Only call this when the user explicitly asks to be remembered, or " +
        "shares something clearly meant to persist beyond the current message.",
      parameters: {
        type: "object",
        properties: {
          fact: { type: "string", description: "A short, specific fact, e.g. 'Name is Alex' or 'Prefers Python over JavaScript'" },
        },
        required: ["fact"],
      },
    },
  },
];

interface AiMessage {
  role: string;
  content: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
}

export interface AgentResult {
  text: string;
  toolCalls: ToolCall[];
  model: string;
  route: Route | "image-analysis";
}

// Llama's tool-calling template derails on messages that don't need a tool
// ("hi" produces rambling about function calls), so a cheap router call first
// decides whether tools should be attached at all.
const ROUTER_PROMPT =
  "You are a router. Look at the user's latest message and reply with exactly one word:\n" +
  "- image : they explicitly ask to generate/create/draw/make an image, picture, photo, or artwork\n" +
  "- browse : they give a specific URL to read or summarize\n" +
  "- search : they ask about current events, live data, or facts that require looking up the web\n" +
  "- remember : they explicitly ask to be remembered, or state a durable fact about themselves meant to persist\n" +
  "- none : anything else (greetings, chat, opinions, writing text, writing code, explanations)\n" +
  "Reply with only the single word.";

export type Route = "image" | "browse" | "search" | "remember" | "none";

export async function routeMessage(env: CloudflareEnv, userMessage: string): Promise<Route> {
  try {
    const result = (await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: ROUTER_PROMPT },
        { role: "user", content: userMessage.slice(0, 500) },
      ],
      max_tokens: 8,
    })) as { response?: string };
    const word = (result.response ?? "").trim().toLowerCase();
    if (word.startsWith("image")) return "image";
    if (word.startsWith("browse")) return "browse";
    if (word.startsWith("search")) return "search";
    if (word.startsWith("remember")) return "remember";
    return "none";
  } catch {
    return "none";
  }
}

// Streaming and Workers AI's function-calling (`tools`) don't mix cleanly —
// tool-call JSON can't be usefully streamed token-by-token. So real streaming
// is only attempted on the "none" route (the common plain-chat case, no tool
// needed); anything that might call a tool falls back to the existing
// non-streamed multi-round flow below, which already knows how to parse
// tool_calls out of a complete response.
export async function streamPlainReply(
  env: CloudflareEnv,
  history: { role: "user" | "assistant"; content: string }[],
  visitor: string
): Promise<ReadableStream<Uint8Array>> {
  const memories = await getMemories(env.RATE_LIMIT_KV, visitor);
  const messages: AiMessage[] = [{ role: "system", content: buildSystemPrompt(memories) }, ...history.slice(-12)];
  const upstream = (await env.AI.run(MODEL, { messages, max_tokens: 1024, stream: true })) as ReadableStream<Uint8Array>;

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.getReader();

  // Workers AI emits OpenAI-style SSE lines (`data: {"response":"..."}`,
  // terminated by `data: [DONE]`). Re-wrapped into our own minimal
  // `{ token }` shape so the wire format isn't tied to Workers AI's exact
  // upstream shape, and so a final `{ done: true }` marker can be added.
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload) as { response?: string };
              if (parsed.response) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: parsed.response })}\n\n`));
              }
            } catch {
              // malformed/partial SSE fragment — skip it
            }
          }
        }
      } finally {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      }
    },
  });
}

export async function runAgent(
  env: CloudflareEnv,
  history: { role: "user" | "assistant"; content: string }[],
  visitor: string,
  image?: { dataUrl: string; question: string },
  precomputedRoute?: Route
): Promise<AgentResult> {
  if (image) {
    const result = await env.AI.run(VISION_MODEL, {
      task: "query",
      image: image.dataUrl,
      question: image.question || "Describe this image in detail.",
      max_tokens: 1024,
      reasoning: false,
      stream: false,
    } as never);
    // Moondream nests its output under `result`
    const r = result as { result?: { answer?: string; caption?: string }; answer?: string; caption?: string };
    const text =
      r.result?.answer ?? r.result?.caption ?? r.answer ?? r.caption ?? "I couldn't analyze that image.";
    return { text, toolCalls: [], model: VISION_MODEL, route: "image-analysis" };
  }

  const memories = await getMemories(env.RATE_LIMIT_KV, visitor);
  const messages: AiMessage[] = [
    { role: "system", content: buildSystemPrompt(memories) },
    ...history.slice(-12),
  ];
  const toolCalls: ToolCall[] = [];
  const lastUserMessage = history[history.length - 1]?.content ?? "";
  const route = precomputedRoute ?? (await routeMessage(env, lastUserMessage));

  // Scoped across every round (not reset per round) — the model doesn't just
  // repeat a tool call within one response, it sometimes calls generate_image
  // again in a *later* round after already generating one (e.g. reflecting
  // on its own tool result and deciding to "confirm" by generating again).
  // Each unique action still only runs once per whole request either way.
  const seen = new Map<string, { output: string; tc: ToolCall }>();

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const allowTools = route !== "none" && round < MAX_TOOL_ROUNDS - 1;
    const result = await env.AI.run(MODEL, {
      messages,
      ...(allowTools ? { tools: TOOLS } : {}),
      max_tokens: 1024,
    }) as { response?: string; tool_calls?: { name: string; arguments: Record<string, unknown> }[] };

    const rawCalls = allowTools ? result.tool_calls : undefined;
    if (!rawCalls || rawCalls.length === 0) {
      return { text: result.response ?? "I'm not sure how to respond to that.", toolCalls, model: MODEL, route };
    }

    const calls = rawCalls.map((c, i) => ({ ...c, id: `call_${round}_${i}` }));

    messages.push({
      role: "assistant",
      content: result.response ?? "",
      tool_calls: calls.map((c) => ({
        id: c.id,
        type: "function" as const,
        function: { name: c.name, arguments: JSON.stringify(c.arguments ?? {}) },
      })),
    });

    for (const call of calls) {
      const args = (call.arguments ?? {}) as Record<string, string>;
      const signature = `${call.name}:${JSON.stringify(Object.entries(args).sort())}`;
      const prior = seen.get(signature);
      let output: string;
      let tc: ToolCall;

      if (prior) {
        output = prior.output;
        tc = prior.tc;
      } else if (call.name === "web_search") {
        const outcome = await webSearch(args.query ?? "");
        output = outcome.formatted;
        tc = {
          id: crypto.randomUUID(),
          kind: "search",
          label: `Searched the web for "${args.query}"`,
          detail: output.slice(0, 300),
          status: "done",
          sources: outcome.results.map((r) => ({ title: r.title, url: r.url })).filter((s) => s.url),
        };
      } else if (call.name === "browse_page") {
        output = await browsePage(args.url ?? "");
        tc = {
          id: crypto.randomUUID(),
          kind: "browse",
          label: `Browsed ${args.url}`,
          detail: output.slice(0, 300),
          status: "done",
        };
      } else if (call.name === "generate_image") {
        const allowed = await checkImageLimit(env.RATE_LIMIT_KV, visitor);
        if (!allowed) {
          output = "Image generation daily limit reached for this visitor. Try again tomorrow.";
          tc = {
            id: crypto.randomUUID(),
            kind: "image",
            label: `Generating image: "${args.prompt}"`,
            detail: output,
            status: "done",
          };
        } else {
          try {
            const dataUrl = await generateImage(env, args.prompt ?? "");
            await recordImage(env.RATE_LIMIT_KV);
            output = "Image generated successfully and shown to the user.";
            tc = {
              id: crypto.randomUUID(),
              kind: "image",
              label: `Generated image: "${args.prompt}"`,
              imageUrl: dataUrl,
              status: "done",
            };
          } catch (err) {
            if (isQuotaError(err)) throw err;
            output = "Image generation failed.";
            tc = {
              id: crypto.randomUUID(),
              kind: "image",
              label: `Generating image: "${args.prompt}"`,
              detail: output,
              status: "done",
            };
          }
        }
      } else if (call.name === "remember_fact") {
        const fact = args.fact ?? "";
        await addMemory(env.RATE_LIMIT_KV, visitor, fact);
        output = "Noted — I'll remember that in future conversations.";
        tc = {
          id: crypto.randomUUID(),
          kind: "memory",
          label: `Remembered: "${fact}"`,
          status: "done",
        };
      } else {
        output = "Unknown tool.";
        tc = {
          id: crypto.randomUUID(),
          kind: "search",
          label: call.name,
          detail: output,
          status: "done",
        };
      }

      if (!prior) {
        seen.set(signature, { output, tc });
        toolCalls.push(tc);
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: output });
    }
  }

  return {
    text: "I ran into trouble completing that request after a few tool calls — try rephrasing it.",
    toolCalls,
    model: MODEL,
    route,
  };
}
