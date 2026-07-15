"use client";

import { useEffect, useState } from "react";

export const QUOTA_EVENT = "nrt-quota-exhausted";

export default function StatusBadge() {
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json() as Promise<{ exhausted?: boolean }>)
      .then((d) => setExhausted(Boolean(d.exhausted)))
      .catch(() => {});

    const onExhausted = () => setExhausted(true);
    window.addEventListener(QUOTA_EVENT, onExhausted);
    return () => window.removeEventListener(QUOTA_EVENT, onExhausted);
  }, []);

  if (exhausted) {
    return (
      <span
        title="The free daily AI budget is used up; it resets at midnight UTC."
        className="flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50/60 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400"
      >
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
        at capacity
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 rounded-full border border-zinc-200/70 px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:border-zinc-800/70 dark:text-zinc-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      live
    </span>
  );
}
