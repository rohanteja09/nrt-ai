"use client";

import { motion } from "framer-motion";

function ImageIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <circle cx="7" cy="8" r="1.5" />
      <path d="M17.5 13.5l-4.5-4-6 5.5" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M17 17l-4-4" />
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 5.5l-4 4.5 4 4.5M13.5 5.5l4 4.5-4 4.5M11.5 4l-3 12" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M2.5 10h15M10 2.5c2.2 2.1 3.4 4.8 3.4 7.5s-1.2 5.4-3.4 7.5c-2.2-2.1-3.4-4.8-3.4-7.5S7.8 4.6 10 2.5z" />
    </svg>
  );
}

const SUGGESTIONS = [
  {
    Icon: ImageIcon,
    label: "Generate an image",
    text: "Generate an image of a neon city skyline at night",
    ring: "from-blue-500 to-indigo-700",
  },
  {
    Icon: SearchIcon,
    label: "Search the web",
    text: "Search the web for who won the last cricket world cup",
    ring: "from-cyan-500 to-blue-700",
  },
  {
    Icon: CodeIcon,
    label: "Write & run code",
    text: "Write and run code that reverses a string",
    ring: "from-amber-500 to-orange-700",
  },
  {
    Icon: GlobeIcon,
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
          className="group flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white/85 px-3.5 py-2.5 text-left shadow-sm backdrop-blur-sm transition-colors hover:border-blue-400/70 dark:border-zinc-800/80 dark:bg-zinc-950/85 dark:hover:border-blue-600/70"
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${s.ring} shadow-sm`}
          >
            <s.Icon />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{s.label}</span>
            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{s.text}</span>
          </span>
          <span className="ml-auto text-zinc-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500 dark:text-zinc-700">
            {"→"}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
