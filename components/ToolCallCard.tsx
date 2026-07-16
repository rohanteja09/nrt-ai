"use client";

import { motion } from "framer-motion";
import type { ToolCall } from "@/lib/types";

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const ICON: Record<ToolCall["kind"], string> = {
  search: "\u{1F50D}",
  browse: "\u{1F310}",
  image: "\u{1F3A8}",
  code: "\u{1F4BB}",
  memory: "\u{1F9E0}",
};

const RING: Record<ToolCall["kind"], string> = {
  search: "from-cyan-400/40 to-blue-500/40",
  browse: "from-emerald-400/40 to-teal-500/40",
  image: "from-blue-500/40 to-zinc-900/40",
  code: "from-amber-400/40 to-orange-500/40",
  memory: "from-violet-400/40 to-purple-500/40",
};

const ICON_COLOR: Record<ToolCall["kind"], string> = {
  search: "text-cyan-500",
  browse: "text-emerald-500",
  image: "text-blue-500",
  code: "text-amber-500",
  memory: "text-violet-500",
};

function ToolIcon({ call }: { call: ToolCall }) {
  const running = call.status === "running";

  if (call.kind === "search") {
    return (
      <span className={`radar-ping ${ICON_COLOR[call.kind]}`}>
        {running && (
          <>
            <span className="ring" />
            <span className="ring delay" />
          </>
        )}
        <span className="relative">{ICON[call.kind]}</span>
      </span>
    );
  }

  if (call.kind === "browse") {
    return <span className={running ? "spin-slow inline-block" : ""}>{ICON[call.kind]}</span>;
  }

  if (call.kind === "code") {
    return (
      <motion.span
        animate={running ? { rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 1, repeat: running ? Infinity : 0 }}
      >
        {ICON[call.kind]}
      </motion.span>
    );
  }

  return <span>{ICON[call.kind]}</span>;
}

export default function ToolCallCard({ call }: { call: ToolCall }) {
  const running = call.status === "running";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`my-2 rounded-xl border border-white/10 bg-gradient-to-br ${RING[call.kind]} p-[1px] ${
        running ? "shimmer" : ""
      }`}
    >
      <div className="rounded-[11px] bg-white/90 px-3 py-2 text-sm backdrop-blur-sm dark:bg-zinc-950/90">
        <div className="flex items-center gap-2">
          <ToolIcon call={call} />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {call.label}
          </span>
          {running && (
            <span className="ml-1 flex gap-0.5">
              <span className="typing-dot h-1 w-1 rounded-full bg-amber-500" />
              <span className="typing-dot h-1 w-1 rounded-full bg-amber-500" />
              <span className="typing-dot h-1 w-1 rounded-full bg-amber-500" />
            </span>
          )}
        </div>

        {call.kind === "image" && running && (
          <div className="blur-resolve mt-2 h-24 w-full rounded-md bg-gradient-to-br from-blue-400 via-indigo-500 to-zinc-900" />
        )}
        {call.kind === "search" && running && (
          <div className="mt-2 space-y-1.5">
            <div className="h-2.5 w-3/4 animate-pulse rounded bg-cyan-500/20" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-cyan-500/20" />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-cyan-500/20" />
          </div>
        )}
        {call.kind === "browse" && running && (
          <div className="mt-2 space-y-1.5">
            <div className="h-2.5 w-full animate-pulse rounded bg-emerald-500/20" />
            <div className="h-2.5 w-5/6 animate-pulse rounded bg-emerald-500/20" />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-emerald-500/20" />
          </div>
        )}
        {call.kind === "code" && running && (
          <div className="mt-2 space-y-1.5 rounded-md bg-zinc-900/90 p-2">
            <div className="h-2 w-2/3 animate-pulse rounded bg-amber-400/30" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-amber-400/20" />
            <div className="h-2 w-3/4 animate-pulse rounded bg-amber-400/25" />
          </div>
        )}

        {call.detail && !(call.sources && call.sources.length > 0) && (
          <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-500 dark:text-zinc-400">
            {call.detail}
          </p>
        )}
        {call.sources && call.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {call.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                title={s.title}
                className="flex max-w-[160px] items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-1 text-[11px] text-cyan-700 hover:bg-cyan-500/15 dark:text-cyan-400"
              >
                <span className="truncate">{domainOf(s.url)}</span>
              </a>
            ))}
          </div>
        )}
        {call.imageUrl && (
          <div className="group relative mt-2 inline-block">
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              src={call.imageUrl}
              alt={call.label}
              className="max-h-64 rounded-md border border-zinc-200 dark:border-zinc-800"
            />
            <a
              href={call.imageUrl}
              download="nrt-ai-image.jpg"
              title="Download image"
              aria-label="Download image"
              className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-zinc-900/80 px-2 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-zinc-900 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 group-hover:opacity-100"
            >
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2.5v7.5M4.5 7l3.5 3.5L11.5 7M3 13h10" />
              </svg>
              Download
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}
