"use client";

import { motion } from "framer-motion";

const SUGGESTIONS = [
  { icon: "\u{1F3A8}", label: "Generate an image", text: "Generate an image of a neon city skyline at night" },
  { icon: "\u{1F50D}", label: "Search the web", text: "Search the web for who won the last cricket world cup" },
  { icon: "\u{1F4BB}", label: "Write & run code", text: "Write and run code that reverses a string" },
  { icon: "\u{1F310}", label: "Browse a page", text: "Browse https://example.com and summarize it" },
];

export default function SuggestionChips({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {SUGGESTIONS.map((s, i) => (
        <motion.button
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 + i * 0.07, ease: "easeOut" }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onPick(s.text)}
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-zinc-600 backdrop-blur-sm transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
        >
          <span>{s.icon}</span>
          {s.label}
        </motion.button>
      ))}
    </div>
  );
}
