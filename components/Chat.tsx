"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MessageBubble from "./MessageBubble";
import SuggestionChips from "./SuggestionChips";
import SpaceEvents from "./SpaceEvents";
import OrbitSpinner from "./OrbitSpinner";
import type { ChatMessage, ToolCall } from "@/lib/types";

import { QUOTA_EVENT } from "./StatusBadge";
import { SUGGEST_EVENT } from "./Footer";
import UsageBar from "./UsageBar";
import LimitToast from "./LimitToast";
import type { Usage } from "@/lib/rateLimit";
import { useVoiceInput } from "@/lib/useVoiceInput";

interface ChatApiResponse {
  text?: string;
  toolCalls?: ToolCall[];
  error?: string;
  quotaExhausted?: boolean;
  usage?: Usage;
}

const SLASH_COMMANDS = [
  { cmd: "/search", label: "Search the web", template: "Search the web for " },
  { cmd: "/browse", label: "Browse a page", template: "Browse " },
  { cmd: "/image", label: "Generate an image", template: "Generate an image of " },
  { cmd: "/code", label: "Write & run code", template: "Write and run code that " },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [awaitingFirstToken, setAwaitingFirstToken] = useState(false);
  const [focused, setFocused] = useState(false);
  const [lastAssistantId, setLastAssistantId] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [announceText, setAnnounceText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nearBottomRef = useRef(true);
  const voiceBaseRef = useRef("");
  const { supported: voiceSupported, listening, start: startVoice, stop: stopVoice } = useVoiceInput(
    (transcript) => {
      const base = voiceBaseRef.current;
      setInput(`${base}${base && transcript ? " " : ""}${transcript}`);
    }
  );

  useEffect(() => {
    if (nearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowJumpToLatest(false);
    } else {
      setShowJumpToLatest(true);
    }
  }, [messages]);

  // Auto-grow the textarea with content, up to the max-h-32 cap.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
  }, [input]);

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    nearBottomRef.current = nearBottom;
    if (nearBottom) setShowJumpToLatest(false);
  }

  function jumpToLatest() {
    nearBottomRef.current = true;
    setShowJumpToLatest(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json() as Promise<{ usage?: Usage }>)
      .then((d) => d.usage && setUsage(d.usage))
      .catch(() => {});

    const onSuggest = (e: Event) => {
      const text = (e as CustomEvent<string>).detail;
      if (typeof text === "string") {
        setInput(text);
        textareaRef.current?.focus();
      }
    };
    window.addEventListener(SUGGEST_EVENT, onSuggest);
    return () => window.removeEventListener(SUGGEST_EVENT, onSuggest);
  }, []);

  function stop() {
    abortRef.current?.abort();
    setAwaitingFirstToken(false);
  }

  // Keyboard shortcuts: Esc stops a running request; "/" or Cmd/Ctrl+K
  // jumps focus to the input from anywhere on the page.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && awaitingFirstToken) {
        stop();
        return;
      }
      const active = document.activeElement;
      const typingElsewhere =
        active instanceof HTMLInputElement || (active instanceof HTMLTextAreaElement && active !== textareaRef.current);
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const isSlash = e.key === "/" && active !== textareaRef.current && !typingElsewhere;
      if (isModK || isSlash) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [awaitingFirstToken]);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  function applyUsage(next: Usage) {
    setUsage((prev) => {
      if (next.chatsLeft <= 5 && (!prev || next.chatsLeft < prev.chatsLeft)) {
        showToast(
          next.chatsLeft === 0
            ? "That was your last chat for today — resets tomorrow!"
            : `Only ${next.chatsLeft} chat${next.chatsLeft === 1 ? "" : "s"} left today`
        );
      } else if (next.imagesLeft <= 5 && prev && next.imagesLeft < prev.imagesLeft) {
        showToast(
          next.imagesLeft === 0
            ? "That was your last image generation for today — resets tomorrow!"
            : `Only ${next.imagesLeft} image generation${next.imagesLeft === 1 ? "" : "s"} left today`
        );
      }
      return next;
    });
  }

  function pickImage(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setAttachedImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (item) {
      const file = item.getAsFile();
      if (file) {
        e.preventDefault();
        pickImage(file);
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (file) pickImage(file);
  }

  function editMessage(id: string) {
    if (awaitingFirstToken) stop();
    const idx = messages.findIndex((m) => m.id === id);
    if (idx === -1) return;
    setInput(messages[idx].text);
    setMessages(messages.slice(0, idx));
    textareaRef.current?.focus();
  }

  async function performRequest(
    historyForApi: { role: "user" | "assistant"; content: string }[],
    latestUserText: string,
    image: { file: File; previewUrl: string } | null
  ) {
    setAwaitingFirstToken(true);
    setLaunching(true);
    setTimeout(() => setLaunching(false), 750);

    try {
      const payload: Record<string, unknown> = { messages: historyForApi };
      if (image) {
        payload.image = { dataUrl: await fileToDataUrl(image.file), question: latestUserText };
      }

      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data: ChatApiResponse = await res.json();
      setAwaitingFirstToken(false);

      if (data.quotaExhausted) {
        window.dispatchEvent(new Event(QUOTA_EVENT));
      }
      if (data.usage) {
        applyUsage(data.usage);
      }
      if (!res.ok || data.error) {
        const replyId = crypto.randomUUID();
        const errorText = data.error ?? "Something went wrong. Please try again.";
        setMessages((m) => [...m, { id: replyId, role: "assistant", text: errorText }]);
        setLastAssistantId(replyId);
        setAnnounceText(errorText);
        return;
      }

      const replyId = crypto.randomUUID();
      const runningToolCalls = (data.toolCalls ?? []).map((tc) => ({
        ...tc,
        status: "running" as const,
        detail: undefined,
        imageUrl: undefined,
      }));

      setMessages((m) => [...m, { id: replyId, role: "assistant", text: "", toolCalls: runningToolCalls }]);

      if (runningToolCalls.length === 0) {
        setMessages((m) => m.map((msg) => (msg.id === replyId ? { ...msg, text: data.text ?? "" } : msg)));
        setLastAssistantId(replyId);
        setAnnounceText(data.text ?? "");
        return;
      }

      setTimeout(() => {
        setMessages((m) =>
          m.map((msg) => (msg.id === replyId ? { ...msg, text: data.text ?? "", toolCalls: data.toolCalls } : msg))
        );
        setLastAssistantId(replyId);
        setAnnounceText(data.text ?? "");
      }, 900);
    } catch (err) {
      setAwaitingFirstToken(false);
      if (err instanceof DOMException && err.name === "AbortError") {
        return; // user pressed Stop — leave the transcript as-is
      }
      const replyId = crypto.randomUUID();
      const errorText = "Couldn't reach the server. Check your connection and try again.";
      setMessages((m) => [...m, { id: replyId, role: "assistant", text: errorText }]);
      setLastAssistantId(replyId);
      setAnnounceText(errorText);
    }
  }

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    const image = attachedImage;
    if ((!text && !image) || awaitingFirstToken) return;

    const history = messages
      .filter((m) => m.text)
      .map((m) => ({ role: m.role, content: m.text }));

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: text || "What's in this image?",
      imagePreview: image?.previewUrl,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setAttachedImage(null);
    await performRequest([...history, { role: "user", content: userMsg.text }], userMsg.text, image);
  }

  function regenerate(assistantId: string) {
    if (awaitingFirstToken) return;
    const idx = messages.findIndex((m) => m.id === assistantId);
    if (idx === -1) return;
    let userIdx = idx - 1;
    while (userIdx >= 0 && messages[userIdx].role !== "user") userIdx--;
    if (userIdx < 0) return;

    const truncated = messages.slice(0, idx);
    const historyForApi = truncated.filter((m) => m.text).map((m) => ({ role: m.role, content: m.text }));
    setMessages(truncated);
    performRequest(historyForApi, truncated[userIdx].text, null);
  }

  const isEmpty = messages.length === 0;
  const slashQuery = input.startsWith("/") && !input.includes(" ") ? input.slice(1).toLowerCase() : null;
  const slashCommands =
    slashQuery !== null ? SLASH_COMMANDS.filter((c) => c.cmd.slice(1).startsWith(slashQuery)) : [];

  return (
    <div
      className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-4"
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
    >
      {/* Announces the final text of each assistant reply to screen readers,
          without repeating on every typewriter/tool-status update. */}
      <div aria-live="polite" className="sr-only">
        {announceText}
      </div>

      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-2 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-400 bg-blue-500/10 backdrop-blur-sm"
          >
            <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm dark:bg-zinc-900/90 dark:text-blue-300">
              Drop image to attach
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {launching && (
          <motion.div
            initial={{ opacity: 0, y: 0, scaleY: 0.4 }}
            animate={{ opacity: [0, 1, 1, 0], y: -260, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="pointer-events-none absolute bottom-24 left-1/2 z-20 h-10 w-1 -translate-x-1/2 rounded-full bg-gradient-to-t from-cyan-300 via-blue-400 to-transparent shadow-[0_0_12px_2px_rgba(96,165,250,0.8)]"
          />
        )}
      </AnimatePresence>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center gap-6 pb-24 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-2xl border border-white/50 bg-white/65 px-6 py-5 text-center shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-zinc-950/55"
          >
            <h2 className="gradient-text text-3xl font-bold tracking-tight sm:text-4xl">
              What should we do today?
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
              Chat, search the web, browse pages, generate images, and run code — all in one place.
            </p>
          </motion.div>
          <SuggestionChips onPick={(t) => send(t)} />
          <SpaceEvents />
        </div>
      ) : (
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-6">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                animateText={m.id === lastAssistantId}
                onEdit={m.role === "user" ? () => editMessage(m.id) : undefined}
                onRegenerate={
                  m.role === "assistant" && !awaitingFirstToken ? () => regenerate(m.id) : undefined
                }
              />
            ))}
          </AnimatePresence>
          {awaitingFirstToken && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex justify-start"
            >
              <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/70 bg-white/70 px-4 py-3 text-zinc-400 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
                <OrbitSpinner size={18} />
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <AnimatePresence>
        {showJumpToLatest && (
          <motion.button
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={jumpToLatest}
            title="Jump to latest message"
            className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-zinc-200/70 bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-md backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800/70 dark:bg-zinc-900/90 dark:text-zinc-300"
          >
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v9M4 8l4 4 4-4" />
            </svg>
            Jump to latest
          </motion.button>
        )}
      </AnimatePresence>

      <LimitToast message={toast} />

      <div className="sticky bottom-0 pb-4 pt-2">
        <UsageBar usage={usage} />
        {attachedImage && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/80">
            <img src={attachedImage.previewUrl} alt="Attached" className="h-10 w-10 rounded-md object-cover" />
            <span className="flex-1 truncate text-zinc-500">{attachedImage.file.name}</span>
            <button
              onClick={() => setAttachedImage(null)}
              className="rounded-md px-2 py-1 text-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          </div>
        )}
        <div className="relative">
          <AnimatePresence>
            {slashCommands.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-2 w-64 overflow-hidden rounded-xl border border-zinc-200/70 bg-white/95 shadow-lg backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-900/95"
              >
                {slashCommands.map((c) => (
                  <button
                    key={c.cmd}
                    onClick={() => {
                      setInput(c.template);
                      textareaRef.current?.focus();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 focus-visible:outline-none focus-visible:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800"
                  >
                    <span className="font-mono text-xs text-blue-500">{c.cmd}</span>
                    <span className="text-zinc-600 dark:text-zinc-300">{c.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{
              boxShadow: focused
                ? "0 0 0 3px rgba(37,99,235,0.25), 0 8px 24px -8px rgba(37,99,235,0.35)"
                : "0 1px 2px rgba(0,0,0,0.04)",
            }}
            transition={{ duration: 0.2 }}
            className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white/80 p-2 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => fileInputRef.current?.click()}
              title="Attach an image"
              aria-label="Attach an image"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-900"
            >
              {"\u{1F4CE}"}
            </motion.button>
            {voiceSupported && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                disabled={awaitingFirstToken}
                onClick={() => {
                  if (listening) {
                    stopVoice();
                  } else {
                    voiceBaseRef.current = input;
                    startVoice();
                  }
                }}
                title={listening ? "Stop voice input" : "Speak your message"}
                aria-label={listening ? "Stop voice input" : "Speak your message"}
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-30 ${
                  listening
                    ? "text-red-500"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                {listening && (
                  <span className="radar-ping">
                    <span className="ring" />
                    <span className="ring delay" />
                  </span>
                )}
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="7" y="2.5" width="6" height="10" rx="3" />
                  <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5M7 17.5h6" />
                </svg>
              </motion.button>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask NRT AI to search, browse, generate an image, or write code..."
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-zinc-400"
            />
            {awaitingFirstToken ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stop}
                title="Stop the current request"
                className="flex items-center gap-1.5 rounded-xl border border-red-300/70 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400"
              >
                <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-current" />
                Stop
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: input.trim() || attachedImage ? 1.05 : 1 }}
                whileTap={{ scale: input.trim() || attachedImage ? 0.95 : 1 }}
                onClick={() => send()}
                disabled={!input.trim() && !attachedImage}
                className="rounded-xl bg-gradient-to-br from-blue-700 to-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:opacity-30"
              >
                Send
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
