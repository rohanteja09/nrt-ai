"use client";

import { motion } from "framer-motion";

const CAPABILITIES = [
  { icon: "\u{1F4AC}", label: "Chat", prompt: "Tell me something fascinating about space" },
  { icon: "\u{1F50D}", label: "Search", prompt: "Search the web for today's top tech news" },
  { icon: "\u{1F310}", label: "Browse", prompt: "Browse https://news.ycombinator.com and summarize the top stories" },
  { icon: "\u{1F3A8}", label: "Create", prompt: "Generate an image of a futuristic city at dusk" },
  { icon: "\u{1F4BB}", label: "Code", prompt: "Write and run JavaScript that prints the first 10 Fibonacci numbers" },
];

export const SUGGEST_EVENT = "nrt-suggest";

export default function Footer() {
  return (
    <footer className="relative mt-auto">
      <div className="gradient-bar" aria-hidden="true" />
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
              className="flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1 text-[11px] font-medium text-zinc-500 backdrop-blur-sm transition-colors hover:border-blue-300 hover:text-zinc-800 dark:border-zinc-800/70 dark:bg-zinc-950/60 dark:text-zinc-400 dark:hover:border-blue-700 dark:hover:text-zinc-100"
            >
              <motion.span whileHover={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 0.4 }}>
                {c.icon}
              </motion.span>
              {c.label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
          <span>Built by</span>
          <motion.a
            href="https://github.com/rohanteja09"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }}
            className="gradient-text font-semibold"
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
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
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
