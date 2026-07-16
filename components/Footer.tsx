"use client";

import { motion } from "framer-motion";
import Link from "next/link";

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v6A2.5 2.5 0 0 1 14.5 14H8l-3.5 3v-3H5.5A2.5 2.5 0 0 1 3 11.5v-6z" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="5.5" />
      <path d="M17 17l-3.8-3.8" />
    </svg>
  );
}
function BrowseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M2.5 10h15M10 2.5c2.2 2.1 3.4 4.8 3.4 7.5s-1.2 5.4-3.4 7.5c-2.2-2.1-3.4-4.8-3.4-7.5S7.8 4.6 10 2.5z" />
    </svg>
  );
}
function CreateIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2.5l1.8 4.3 4.3 1.8-4.3 1.8-1.8 4.3-1.8-4.3-4.3-1.8 4.3-1.8L10 2.5z" />
      <path d="M16 14v3M14.5 15.5h3" />
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 6l-4 4 4 4M13 6l4 4-4 4" />
    </svg>
  );
}

const CAPABILITIES = [
  { Icon: ChatIcon, label: "Chat", prompt: "Tell me something fascinating about space" },
  { Icon: SearchIcon, label: "Search", prompt: "Search the web for today's top tech news" },
  { Icon: BrowseIcon, label: "Browse", prompt: "Browse https://news.ycombinator.com and summarize the top stories" },
  { Icon: CreateIcon, label: "Create", prompt: "Generate an image of a futuristic city at dusk" },
  { Icon: CodeIcon, label: "Code", prompt: "Write and run JavaScript that prints the first 10 Fibonacci numbers" },
];

export const SUGGEST_EVENT = "nrt-suggest";

export default function Footer() {
  return (
    <footer className="pointer-events-auto relative mt-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {CAPABILITIES.map((c, i) => (
            <motion.button
              key={c.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              whileHover={{ y: -3, scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={() =>
                window.dispatchEvent(new CustomEvent(SUGGEST_EVENT, { detail: c.prompt }))
              }
              title={`Try: ${c.prompt}`}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-blue-300/60 hover:bg-black/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <motion.span whileHover={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 0.4 }}>
                <c.Icon />
              </motion.span>
              {c.label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-white/75" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
          <Link href="/stats" className="underline decoration-white/30 underline-offset-2 hover:text-white hover:decoration-white/60">
            Live stats
          </Link>
          <span aria-hidden="true">&middot;</span>
          <span>Built by</span>
          <motion.a
            href="https://github.com/rohanteja09"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }}
            className="gradient-text-bright font-semibold"
          >
            Rohan Teja Nallapaneni
          </motion.a>
          <motion.a
            href="https://github.com/rohanteja09"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            whileHover={{ rotate: 360, scale: 1.15 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="text-white/70 hover:text-white"
          >
            <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </motion.a>
        </div>
      </div>
    </footer>
  );
}
