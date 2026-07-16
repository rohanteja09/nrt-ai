"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Logo";
import type { PublicStats } from "@/lib/stats";

function StatTile({ label, value, delay }: { label: string; value: number | null; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="rounded-2xl border border-white/50 bg-white/70 p-5 text-center shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-zinc-950/60"
    >
      <div className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value === null ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        ) : (
          value.toLocaleString()
        )}
      </div>
      <p className="mt-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
    </motion.div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json() as Promise<PublicStats>)
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <header className="relative border-b border-white/40 bg-white/60 px-4 py-3 backdrop-blur-md dark:border-white/5 dark:bg-zinc-950/50">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} />
            <div>
              <h1 className="text-base font-semibold tracking-tight">NRT AI</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Live usage stats</p>
            </div>
          </Link>
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            &larr; Back to chat
          </Link>
        </div>
        <div className="gradient-bar absolute inset-x-0 bottom-0" />
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6 text-center"
        >
          <h2 className="gradient-text text-2xl font-bold tracking-tight sm:text-3xl">How much is NRT AI being used?</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Real numbers, pulled straight from the same rate-limit store that keeps this demo free and always on.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Chats today" value={stats?.chatsToday ?? null} delay={0} />
          <StatTile label="Images today" value={stats?.imagesToday ?? null} delay={0.05} />
          <StatTile label="Chats all-time" value={stats?.chatsAllTime ?? null} delay={0.1} />
          <StatTile label="Images all-time" value={stats?.imagesAllTime ?? null} delay={0.15} />
        </div>
      </div>
    </div>
  );
}
