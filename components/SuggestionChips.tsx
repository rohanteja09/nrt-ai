"use client";

import { motion } from "framer-motion";

const SUGGESTIONS = [
  {
    tag: "IMG",
    icon: "\u{1F3A8}",
    label: "Generate an image",
    text: "Generate an image of a neon city skyline at night",
    ring: "from-blue-500 to-indigo-700",
  },
  {
    tag: "NET",
    icon: "\u{1F50D}",
    label: "Search the web",
    text: "Search the web for who won the last cricket world cup",
    ring: "from-cyan-500 to-blue-700",
  },
  {
    tag: "SYS",
    icon: "\u{1F4BB}",
    label: "Write & run code",
    text: "Write and run code that reverses a string",
    ring: "from-amber-500 to-orange-700",
  },
  {
    tag: "WEB",
    icon: "\u{1F310}",
    label: "Browse a page",
    text: "Browse https://example.com and summarize it",
    ring: "from-emerald-500 to-teal-700",
  },
];

export default function SuggestionChips({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {SUGGESTIONS.map((s, i) => (
        <motion.button
          key={s.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.15 + i * 0.08, ease: "easeOut" }}
          whileHover={{ x: 6, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPick(s.text)}
          className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-zinc-200/80 bg-white/85 px-3.5 py-2.5 text-left shadow-sm backdrop-blur-sm transition-all hover:border-cyan-400/70 hover:shadow-[0_0_18px_-4px_rgba(34,211,238,0.5)] dark:border-zinc-800/80 dark:bg-zinc-950/85 dark:hover:border-cyan-500/60"
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${s.ring} text-base shadow-sm`}
          >
            {s.icon}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] font-semibold tracking-wider text-cyan-600/80 dark:text-cyan-400/80">
                [{s.tag}]
              </span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{s.label}</span>
            </span>
            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{s.text}</span>
          </span>
          <span className="ml-auto font-mono text-zinc-300 transition-all group-hover:translate-x-1 group-hover:text-cyan-500 dark:text-zinc-700">
            {"→"}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
