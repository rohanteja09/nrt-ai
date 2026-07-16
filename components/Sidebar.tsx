"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ACTIVE_CONVERSATION_EVENT,
  HISTORY_EVENT,
  SWITCH_CONVERSATION_EVENT,
  createConversationId,
  deleteConversation,
  getStoredActiveId,
  listConversations,
  type Conversation,
} from "@/lib/history";
import { SUGGEST_EVENT } from "./Footer";

function switchTo(id: string) {
  window.dispatchEvent(new CustomEvent<string>(ACTIVE_CONVERSATION_EVENT, { detail: id }));
  window.dispatchEvent(new CustomEvent<string>(SWITCH_CONVERSATION_EVENT, { detail: id }));
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="5.5" />
      <path d="M17 17l-3.8-3.8" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <circle cx="7" cy="8" r="1.3" />
      <path d="M17.5 13.5l-4.5-4-6 5.5" />
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 6l-4 4 4 4M13 6l4 4-4 4" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M2.5 10h15M10 2.5c2.2 2.1 3.4 4.8 3.4 7.5s-1.2 5.4-3.4 7.5c-2.2-2.1-3.4-4.8-3.4-7.5S7.8 4.6 10 2.5z" />
    </svg>
  );
}

const QUICK_ACTIONS = [
  { label: "Search the web", prompt: "Search the web for who won the last cricket world cup", Icon: SearchIcon },
  { label: "Generate an image", prompt: "Generate an image of a neon city skyline at night", Icon: ImageIcon },
  { label: "Write & run code", prompt: "Write and run code that reverses a string", Icon: CodeIcon },
  { label: "Browse a page", prompt: "Browse https://example.com and summarize it", Icon: GlobeIcon },
];

function suggest(prompt: string) {
  window.dispatchEvent(new CustomEvent<string>(SUGGEST_EVENT, { detail: prompt }));
}

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors persisted state post-mount, same pattern as ThemeToggle
    setConversations(listConversations());
    setActiveId(getStoredActiveId());

    const onHistory = () => setConversations(listConversations());
    const onActive = (e: Event) => setActiveId((e as CustomEvent<string>).detail);
    window.addEventListener(HISTORY_EVENT, onHistory);
    window.addEventListener(ACTIVE_CONVERSATION_EVENT, onActive);
    return () => {
      window.removeEventListener(HISTORY_EVENT, onHistory);
      window.removeEventListener(ACTIVE_CONVERSATION_EVENT, onActive);
    };
  }, []);

  function newChat() {
    switchTo(createConversationId());
    setMobileOpen(false);
  }

  function pick(id: string) {
    switchTo(id);
    setMobileOpen(false);
  }

  function pickQuickAction(prompt: string) {
    suggest(prompt);
    setMobileOpen(false);
  }

  function remove(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteConversation(id);
    if (id === activeId) newChat();
  }

  const panel = (
    <div className="flex h-full w-64 flex-col border-r border-white/40 bg-white/70 backdrop-blur-md dark:border-white/5 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between gap-2 p-3">
        <button
          onClick={newChat}
          className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800/70 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 4v12M4 10h12" />
          </svg>
          New chat
        </button>
        <button
          onClick={() => setOpen(false)}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:flex dark:hover:bg-zinc-900"
        >
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 4.5L7 10l5.5 5.5" />
          </svg>
        </button>
      </div>

      <nav className="px-2 pb-2">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => pickQuickAction(a.prompt)}
            title={a.prompt}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <span className="shrink-0 text-zinc-400 dark:text-zinc-500">
              <a.Icon />
            </span>
            {a.label}
          </button>
        ))}
      </nav>

      <div className="mx-3 border-t border-zinc-200/70 dark:border-zinc-800/70" />

      <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
        Chats
      </p>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Your conversations will show up here.
          </p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => pick(c.id)}
            className={`group mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              c.id === activeId
                ? "accent-active-bg"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            <span className="flex-1 truncate">{c.title}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => remove(e, c.id)}
              onKeyDown={(e) => e.key === "Enter" && remove(e as unknown as React.MouseEvent, c.id)}
              title="Delete conversation"
              aria-label="Delete conversation"
              className="rounded p-1 text-zinc-400 opacity-0 hover:bg-zinc-200 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-zinc-800"
            >
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M3.5 4.5h9M6.5 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M7 7.5v4M9 7.5v4M4.5 4.5l.6 8a1 1 0 001 .9h3.8a1 1 0 001-.9l.6-8" />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: an in-flow collapsible column, always in the layout. Sticky
          + its own viewport height so it stays put regardless of how tall
          the chat content grows (long code blocks etc. can make the page
          itself scroll — the sidebar shouldn't scroll away with it). */}
      <div className={`pointer-events-auto sticky top-0 hidden h-screen shrink-0 overflow-hidden transition-[width] duration-200 md:block ${open ? "w-64" : "w-0"}`}>
        {open && panel}
      </div>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Open sidebar"
          aria-label="Open sidebar"
          className="pointer-events-auto fixed left-2 top-3 z-30 hidden h-8 w-8 items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 text-zinc-500 backdrop-blur-sm hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:flex dark:border-zinc-800/70 dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
        >
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="4" width="14" height="12" rx="2" />
            <path d="M8 4v12" />
          </svg>
        </button>
      )}

      {/* Mobile: hamburger + off-canvas drawer with a backdrop. Fixed-positioned
          so this component can be dropped anywhere without needing to sit
          inside the header's own flex row. */}
      <button
        onClick={() => setMobileOpen(true)}
        title="Open conversation history"
        aria-label="Open conversation history"
        className="pointer-events-auto fixed left-2 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 text-zinc-500 backdrop-blur-sm hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:hidden dark:border-zinc-800/70 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 5.5h14M3 10h14M3 14.5h14" />
        </svg>
      </button>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="pointer-events-auto fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto fixed inset-y-0 left-0 z-50 md:hidden"
            >
              {panel}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
