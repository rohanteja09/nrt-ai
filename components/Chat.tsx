"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MessageBubble from "./MessageBubble";
import SuggestionChips from "./SuggestionChips";
import OrbitSpinner from "./OrbitSpinner";
import type { ChatMessage, ToolCall } from "@/lib/types";

interface ChatApiResponse {
  text?: string;
  toolCalls?: ToolCall[];
  error?: string;
}

async function fileToBytes(file: File): Promise<number[]> {
  const buf = await file.arrayBuffer();
  return Array.from(new Uint8Array(buf));
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [awaitingFirstToken, setAwaitingFirstToken] = useState(false);
  const [focused, setFocused] = useState(false);
  const [lastAssistantId, setLastAssistantId] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function pickImage(file: File | undefined) {
    if (!file) return;
    setAttachedImage({ file, previewUrl: URL.createObjectURL(file) });
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
    setAwaitingFirstToken(true);

    try {
      const payload: Record<string, unknown> = {
        messages: [...history, { role: "user", content: userMsg.text }],
      };
      if (image) {
        payload.image = { bytes: await fileToBytes(image.file), question: userMsg.text };
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ChatApiResponse = await res.json();
      setAwaitingFirstToken(false);

      if (!res.ok || data.error) {
        const replyId = crypto.randomUUID();
        setMessages((m) => [
          ...m,
          { id: replyId, role: "assistant", text: data.error ?? "Something went wrong. Please try again." },
        ]);
        setLastAssistantId(replyId);
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
        return;
      }

      setTimeout(() => {
        setMessages((m) =>
          m.map((msg) => (msg.id === replyId ? { ...msg, text: data.text ?? "", toolCalls: data.toolCalls } : msg))
        );
        setLastAssistantId(replyId);
      }, 900);
    } catch {
      setAwaitingFirstToken(false);
      const replyId = crypto.randomUUID();
      setMessages((m) => [
        ...m,
        { id: replyId, role: "assistant", text: "Couldn't reach the server. Check your connection and try again." },
      ]);
      setLastAssistantId(replyId);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-4">
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center"
          >
            <h2 className="gradient-text text-3xl font-semibold tracking-tight sm:text-4xl">
              What should we do today?
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Chat, search the web, browse pages, generate images, and run code — all in one place.
            </p>
          </motion.div>
          <SuggestionChips onPick={(t) => send(t)} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-6">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} animateText={m.id === lastAssistantId} />
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

      <div className="sticky bottom-0 pb-4 pt-2">
        {attachedImage && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 p-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/80">
            <img src={attachedImage.previewUrl} alt="Attached" className="h-10 w-10 rounded-md object-cover" />
            <span className="flex-1 truncate text-zinc-500">{attachedImage.file.name}</span>
            <button
              onClick={() => setAttachedImage(null)}
              className="rounded-md px-2 py-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          </div>
        )}
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            {"\u{1F4CE}"}
          </motion.button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
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
          <motion.button
            whileHover={{ scale: input.trim() || attachedImage ? 1.05 : 1 }}
            whileTap={{ scale: input.trim() || attachedImage ? 0.95 : 1 }}
            onClick={() => send()}
            disabled={(!input.trim() && !attachedImage) || awaitingFirstToken}
            className="rounded-xl bg-gradient-to-br from-blue-700 to-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity disabled:opacity-30"
          >
            Send
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
