import type { ToolCall } from "./types";
import { webSearch } from "./tools/webSearch";
import { browsePage } from "./tools/browsePage";
import { generateImage } from "./tools/generateImage";
import { checkImageLimit } from "./rateLimit";
import { isQuotaError } from "./quota";

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const VISION_MODEL = "@cf/moondream/moondream3.1-9B-A2B";
const MAX_TOOL_ROUNDS = 3;

const SYSTEM_PROMPT =
  "You are NRT AI, an AI assistant built by Rohan Teja Nallapaneni.\n\n" +
  "About your creator (share naturally when asked about him): Rohan Teja Nallapaneni is a Computer Science " +
  "student in the Department of Computing Technologies, School of Computing, at SRM Institute of Science and " +
  "Technology (Kattankulathur, Chennai, India). He presented a research paper on Android malware detection " +
  "using static and dynamic analysis at ICICST 2026, organized by Dr. B.R. Ambedkar National Institute of " +
  "Technology, Jalandhar. He builds full-stack and AI projects — including NRT AI itself (this assistant: " +
  "chat, web search, page browsing, image generation and analysis, and runnable code, running entirely on " +
  "Cloudflare's free tier) and LayoutIQ, a layout-plan compliance checker for Andhra Pradesh planning " +
  "regulations. His GitHub is github.com/rohanteja09.\n\n" +
  "You have three tools available: web_search, browse_page, and generate_image. " +
  "The default behavior for EVERY message is to NOT call any tool and just answer in plain text. " +
  "Only call generate_image if the user's message explicitly contains a request to create, draw, generate, " +
  "or make an image, picture, photo, or artwork. A request to write text, describe something, or say something " +
  "is NOT a request for an image — never call generate_image for those. " +
  "Only call web_search if the question is about current events, live data, or facts you are genuinely unsure of. " +
  "Only call browse_page if the user gave you a specific URL. " +
  "For greetings, small talk, opinions, jokes, or anything else — respond directly in plain text with no tool call.\n\n" +
  "Examples:\n" +
  "User: \"Say hello in 5 words\" -> plain text reply, no tool call, e.g. \"Hello! Great to meet you.\"\n" +
  "User: \"How are you?\" -> plain text reply, no tool call.\n" +
  "User: \"Generate an image of a sunset\" -> call generate_image with prompt \"a sunset\".\n" +
  "User: \"What's the weather like today in Tokyo?\" -> call web_search.\n\n" +
  "If asked to write code, put it in a fenced code block. Be concise and helpful.\n\n" +
  "IMPORTANT — links: always write URLs as markdown links, e.g. [github.com/rohanteja09](https://github.com/rohanteja09), " +
  "never as bare text. When you answer from web_search or browse_page results, cite your sources at the end as a short " +
  "markdown list of links using the URLs from the tool results. Accurate, clickable sources matter for research.";

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
}

// Llama's tool-calling template derails on messages that don't need a tool
// ("hi" produces rambling about function calls), so a cheap router call first
// decides whether tools should be attached at all.
const ROUTER_PROMPT =
  "You are a router. Look at the user's latest message and reply with exactly one word:\n" +
  "- image : they explicitly ask to generate/create/draw/make an image, picture, photo, or artwork\n" +
  "- browse : they give a specific URL to read or summarize\n" +
  "- search : they ask about current events, live data, or facts that require looking up the web\n" +
  "- none : anything else (greetings, chat, opinions, writing text, writing code, explanations)\n" +
  "Reply with only the single word.";

async function routeMessage(env: CloudflareEnv, userMessage: string): Promise<"image" | "browse" | "search" | "none"> {
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
    return "none";
  } catch {
    return "none";
  }
}

export async function runAgent(
  env: CloudflareEnv,
  history: { role: "user" | "assistant"; content: string }[],
  visitor: string,
  image?: { dataUrl: string; question: string }
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
    return { text, toolCalls: [] };
  }

  const messages: AiMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-12),
  ];
  const toolCalls: ToolCall[] = [];
  const lastUserMessage = history[history.length - 1]?.content ?? "";
  const route = await routeMessage(env, lastUserMessage);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const allowTools = route !== "none" && round < MAX_TOOL_ROUNDS - 1;
    const result = await env.AI.run(MODEL, {
      messages,
      ...(allowTools ? { tools: TOOLS } : {}),
      max_tokens: 1024,
    }) as { response?: string; tool_calls?: { name: string; arguments: Record<string, unknown> }[] };

    const rawCalls = allowTools ? result.tool_calls : undefined;
    if (!rawCalls || rawCalls.length === 0) {
      return { text: result.response ?? "I'm not sure how to respond to that.", toolCalls };
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
      let output: string;
      let tc: ToolCall;

      if (call.name === "web_search") {
        output = await webSearch(args.query ?? "");
        tc = {
          id: crypto.randomUUID(),
          kind: "search",
          label: `Searched the web for "${args.query}"`,
          detail: output.slice(0, 300),
          status: "done",
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

      toolCalls.push(tc);
      messages.push({ role: "tool", tool_call_id: call.id, content: output });
    }
  }

  return {
    text: "I ran into trouble completing that request after a few tool calls — try rephrasing it.",
    toolCalls,
  };
}
