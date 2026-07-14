"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function LimitToast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50/95 px-4 py-2 text-xs font-medium text-amber-700 shadow-lg backdrop-blur dark:border-amber-500/40 dark:bg-zinc-900/95 dark:text-amber-400">
            <span>{"⚠️"}</span>
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
