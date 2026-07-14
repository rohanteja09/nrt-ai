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
  const barColor =
    left === 0 ? "bg-red-500" : left <= 5 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="flex items-center gap-1.5" title={`${left} of ${limit} ${label} left today`}>
      <span className="text-xs">{icon}</span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">
        {left}/{limit}
      </span>
    </div>
  );
}

export default function UsageBar({ usage }: { usage: Usage | null }) {
  if (!usage) return null;
  return (
    <div className="mb-1.5 flex items-center justify-end gap-4 px-1">
      <Meter icon={"\u{1F4AC}"} left={usage.chatsLeft} limit={usage.chatLimit} label="chats" />
      <Meter icon={"\u{1F3A8}"} left={usage.imagesLeft} limit={usage.imageLimit} label="images" />
    </div>
  );
}
