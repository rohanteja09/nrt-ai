# NRT AI

A free, always-on AI assistant that chats, searches and browses the web, generates and understands images, writes and runs code, and takes voice input — built by **Rohan Teja Nallapaneni**.

[![CI](https://github.com/rohanteja09/nrt-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/rohanteja09/nrt-ai/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/live%20demo-nrt--ai.rohan--nallapaneni.workers.dev-2563eb)](https://nrt-ai.rohan-nallapaneni.workers.dev)

**Live demo:** https://nrt-ai.rohan-nallapaneni.workers.dev

## What it does

One chat surface, one agent, several tools it can reach for on its own:

- **Chat** — general conversation, powered by Cloudflare Workers AI (Llama 3.3 70B), with a lightweight routing step so plain conversation never gets derailed by unnecessary tool calls.
- **Web search** — a resilient three-provider fallback chain (DuckDuckGo → DuckDuckGo Lite → Wikipedia) so results keep flowing even when one provider blocks datacenter IPs.
- **Browse a page** — give it a URL and it will fetch and read the page, powered by the Workers runtime's native `HTMLRewriter`.
- **Generate images** — text-to-image via Workers AI (FLUX.1 [schnell]).
- **Understand images** — attach a photo and ask about it (Moondream 3.1, license-free on Workers AI).
- **Voice input** — tap the mic and speak your message; live transcription via the browser's Web Speech API, no server round-trip.
- **Write & run code** — the agent writes code in the chat; it runs client-side in a sandboxed iframe in your browser, never on the server.

Each tool call renders as its own animated step in the conversation (search, browse, image generation, code execution) so you can see the agent working, not just see a final answer appear. The background is a real-time 3D scene (three.js): an Earth that lights up on its actual day side and shows city lights on its night side synced to real IST time, satellites in orbit, an asteroid belt, and a couple of distant planets.

## Why it's free forever, with no cold start

Everything runs on Cloudflare's free tier, on a single account:

- **Hosting**: Cloudflare Workers (via `@opennextjs/cloudflare`), served from a permanent `*.workers.dev` URL. Workers are V8 isolates, not sleeping containers — there's no cold start the way there is on free tiers like Render.
- **AI**: Cloudflare Workers AI for chat, vision, and image generation — no external API key, no separate billing relationship.
- **Rate limiting**: a Cloudflare KV-backed per-visitor daily cap (visible in the UI as live "chat limit" / "image limit" meters, with a heads-up toast in the last few requests) keeps any one visitor from exhausting the shared free quota, so the demo stays up for everyone.
- **Graceful quota handling**: if the account's shared daily Workers AI budget ever runs out, the UI shows a friendly "at capacity, back tomorrow" state instead of a raw error.
- **No overage billing**: the Workers Free plan doesn't bill for usage over the daily limit — it just caps it. There's no way for this project to unexpectedly cost money.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Framer Motion](https://motion.dev) for UI animation, [three.js](https://threejs.org) for the WebGL space scene
- [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) to deploy Next.js to Cloudflare Workers
- Cloudflare Workers AI, KV, and the Workers runtime's native `HTMLRewriter` for lightweight web search/browse tools
- GitHub Actions CI (typecheck, lint, build) on every push

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
