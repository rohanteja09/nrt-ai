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
        className="flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-amber-500"
      >
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
        capacity
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 rounded-md border border-cyan-400/30 bg-cyan-400/5 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-cyan-500 dark:text-cyan-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 6px #22d3ee" }} />
      </span>
      online
    </span>
  );
}
