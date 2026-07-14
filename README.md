# NRT AI

A free, always-on AI assistant that chats, searches and browses the web, generates and understands images, and writes and runs code — built by **Rohan Teja Nallapaneni**.

**Live demo:** https://nrt-ai.rohan-nallapaneni.workers.dev

## What it does

One chat surface, one agent, several tools it can reach for on its own:

- **Chat** — general conversation, powered by Cloudflare Workers AI (Llama 3.3 70B).
- **Web search** — the agent can search the web for current information when it needs to.
- **Browse a page** — give it a URL and it will fetch and read the page.
- **Generate images** — text-to-image via Workers AI (FLUX.1 [schnell]).
- **Understand images** — attach a photo and ask about it (Llama 3.2 11B Vision).
- **Write & run code** — the agent writes code in the chat; it runs client-side in a sandboxed iframe in your browser, never on the server.

Each tool call renders as its own animated step in the conversation (search, browse, image generation, code execution) so you can see the agent working, not just see a final answer appear.

## Why it's free forever, with no cold start

Everything runs on Cloudflare's free tier, on a single account:

- **Hosting**: Cloudflare Workers (via `@opennextjs/cloudflare`), served from a permanent `*.workers.dev` URL. Workers are V8 isolates, not sleeping containers — there's no cold start the way there is on free tiers like Render.
- **AI**: Cloudflare Workers AI for chat, vision, and image generation — no external API key, no separate billing relationship.
- **Rate limiting**: a Cloudflare KV-backed per-visitor daily cap keeps any one visitor from exhausting the shared free quota, so the demo stays up for everyone.
- **No overage billing**: the Workers Free plan doesn't bill for usage over the daily limit — it just caps it. There's no way for this project to unexpectedly cost money.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Framer Motion](https://motion.dev) for animation
- [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) to deploy Next.js to Cloudflare Workers
- Cloudflare Workers AI, KV, and the Workers runtime's native `HTMLRewriter` for lightweight web search/browse tools

## Local development

```bash
npm install
npm run dev
```

Cloudflare bindings (Workers AI, KV) are proxied to your real Cloudflare account automatically via `initOpenNextCloudflareForDev()` — no local emulation setup needed. Note: browser-native Workers runtime APIs like `HTMLRewriter` are only available when running under the real Workers runtime — use `npm run preview` to test those against a full local Workers environment before deploying.

## Deploy

```bash
npm run deploy
```

Builds with OpenNext and deploys straight to Cloudflare Workers.

---

Built by [Rohan Teja Nallapaneni](https://github.com/rohanteja09).
