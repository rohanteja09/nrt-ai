"use client";

import type { Usage } from "@/lib/rateLimit";

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v6A2.5 2.5 0 0 1 14.5 14H8l-3.5 3v-3H5.5A2.5 2.5 0 0 1 3 11.5v-6z" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <circle cx="7" cy="8" r="1.5" />
      <path d="M17.5 13.5l-4.5-4-6 5.5" />
    </svg>
  );
}

function Meter({
  Icon,
  label,
  left,
  limit,
}: {
  Icon: () => React.ReactElement;
  label: string;
  left: number;
  limit: number;
}) {
  const pct = limit > 0 ? (left / limit) * 100 : 0;
  const barColor = left === 0 ? "bg-red-400" : left <= 5 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div
      className="flex min-w-[104px] flex-col gap-1 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 backdrop-blur-sm"
      title={`${left} of ${limit} ${label.toLowerCase()} left today`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-white/70">
          <Icon />
          {label}
        </span>
        <span className="text-[10px] font-semibold tabular-nums text-white">
          {left}/{limit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function UsageBar({ usage }: { usage: Usage | null }) {
  if (!usage) return null;
  return (
    <div className="mb-2 flex items-center justify-end gap-2 px-1">
      <Meter Icon={ChatIcon} label="Chat limit" left={usage.chatsLeft} limit={usage.chatLimit} />
      <Meter Icon={ImageIcon} label="Image limit" left={usage.imagesLeft} limit={usage.imageLimit} />
    </div>
  );
}
