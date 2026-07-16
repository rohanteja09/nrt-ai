"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { THEME_STORAGE_KEY } from "./ThemeInit";
import {
  ACCENTS,
  type Accent,
  getReducedMotionOverride,
  getStoredAccent,
  setReducedMotionOverride,
  setStoredAccent,
} from "@/lib/preferences";
import {
  clearAllConversations,
  createConversationId,
  ACTIVE_CONVERSATION_EVENT,
  SWITCH_CONVERSATION_EVENT,
} from "@/lib/history";
import { showToast } from "@/lib/toast";

const ACCENT_SWATCH: Record<Accent, string> = {
  blue: "#2563eb",
  violet: "#7c3aed",
  emerald: "#059669",
  rose: "#e11d48",
  amber: "#d97706",
};

const MOTION_OPTIONS: { value: boolean | null; label: string }[] = [
  { value: null, label: "System" },
  { value: false, label: "On" },
  { value: true, label: "Reduced" },
];

export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [accent, setAccent] = useState<Accent>("blue");
  const [motionPref, setMotionPref] = useState<boolean | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  // document.body only exists client-side — the portal below must wait for
  // mount, otherwise SSR crashes on `document is not defined`.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors persisted state post-mount, same pattern as ThemeToggle
    setDark(document.documentElement.classList.contains("dark"));
    setAccent(getStoredAccent());
    setMotionPref(getReducedMotionOverride());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!confirmingClear) return;
    const t = setTimeout(() => setConfirmingClear(false), 3000);
    return () => clearTimeout(t);
  }, [confirmingClear]);

  function setTheme(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // localStorage unavailable — theme just won't persist
    }
  }

  function pickAccent(next: Accent) {
    setAccent(next);
    setStoredAccent(next);
  }

  function pickMotion(next: boolean | null) {
    setMotionPref(next);
    setReducedMotionOverride(next);
  }

  function handleClearHistory() {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    clearAllConversations();
    const freshId = createConversationId();
    window.dispatchEvent(new CustomEvent<string>(ACTIVE_CONVERSATION_EVENT, { detail: freshId }));
    window.dispatchEvent(new CustomEvent<string>(SWITCH_CONVERSATION_EVENT, { detail: freshId }));
    setConfirmingClear(false);
    showToast("Chat history cleared");
    setOpen(false);
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        title="Settings"
        aria-label="Settings"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="2.5" />
          <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9" />
        </svg>
      </motion.button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                role="dialog"
                aria-modal="true"
                aria-label="Settings"
                className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200/70 bg-white/95 p-5 shadow-xl backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/95"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Settings</h2>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close settings"
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-900"
                  >
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-5 text-sm">
                  <div>
                    <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Theme</p>
                    <div className="flex gap-1.5">
                      {[
                        { label: "Light", value: false },
                        { label: "Dark", value: true },
                      ].map((o) => (
                        <button
                          key={o.label}
                          onClick={() => setTheme(o.value)}
                          className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            dark === o.value
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                              : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Accent color</p>
                    <div className="flex gap-2">
                      {ACCENTS.map((a) => (
                        <button
                          key={a}
                          onClick={() => pickAccent(a)}
                          title={a}
                          aria-label={`${a} accent`}
                          className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-white transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:ring-offset-zinc-950 ${
                            accent === a ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : ""
                          }`}
                          style={{ backgroundColor: ACCENT_SWATCH[a] }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Motion</p>
                    <div className="flex gap-1.5">
                      {MOTION_OPTIONS.map((o) => (
                        <button
                          key={o.label}
                          onClick={() => pickMotion(o.value)}
                          className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            motionPref === o.value
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                              : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <button
                      onClick={handleClearHistory}
                      className={`w-full rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                        confirmingClear
                          ? "border-red-400 bg-red-50 text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-400"
                          : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {confirmingClear ? "Click again to confirm — this can't be undone" : "Clear all chat history"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
