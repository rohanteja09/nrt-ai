"use client";

import type { Usage } from "@/lib/rateLimit";

function Meter({
  icon,
  left,
  limit,
  label,
}: {
  icon: string;
  left: number;
  limit: number;
  label: string;
}) {
  const pct = limit > 0 ? (left / limit) * 100 : 0;
  const barColor = left === 0 ? "bg-red-500" : left <= 5 ? "bg-amber-500" : "bg-cyan-400";
  const glow = left === 0 ? "#ef4444" : left <= 5 ? "#f59e0b" : "#22d3ee";

  return (
    <div
      className="flex items-center gap-1.5 rounded-md border border-zinc-200/70 bg-white/60 px-2 py-1 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-950/60"
      title={`${left} of ${limit} ${label} left today`}
    >
      <span className="text-xs">{icon}</span>
      <div className="h-1 w-14 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%`, boxShadow: `0 0 6px ${glow}` }}
        />
      </div>
      <span className="font-mono text-[10px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
        {left}/{limit}
      </span>
    </div>
  );
}

export default function UsageBar({ usage }: { usage: Usage | null }) {
  if (!usage) return null;
  return (
    <div className="mb-1.5 flex items-center justify-end gap-2 px-1">
      <Meter icon={"\u{1F4AC}"} left={usage.chatsLeft} limit={usage.chatLimit} label="chats" />
      <Meter icon={"\u{1F3A8}"} left={usage.imagesLeft} limit={usage.imageLimit} label="images" />
    </div>
  );
}
