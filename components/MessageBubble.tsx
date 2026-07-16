"use client";

import { motion } from "framer-motion";
import ToolCallCard from "./ToolCallCard";
import Markdown from "./Markdown";
import Logo from "./Logo";
import { useTypewriter } from "@/lib/useTypewriter";
import type { ChatMessage } from "@/lib/types";

export default function MessageBubble({
  message,
  animateText,
  onEdit,
  onRegenerate,
  grouped,
}: {
  message: ChatMessage;
  animateText: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
  /** True when the previous message in the transcript shares this one's role — collapses the repeated avatar/spacing, Slack/iMessage-style. */
  grouped?: boolean;
}) {
  const isUser = message.role === "user";
  // Markdown structure (fences, lists) breaks mid-animation, so only animate plain prose.
  const isPlainProse = !isUser && !/[`*#\[\|]/.test(message.text);
  const shownText = useTypewriter(message.text, animateText && isPlainProse);
  const timeLabel = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group ${grouped ? "mb-1" : "mb-4"} flex items-end gap-1.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="mb-0.5 w-[22px] shrink-0">
          {!grouped && <Logo size={22} />}
        </div>
      )}
      {isUser && onEdit && (
        <button
          onClick={onEdit}
          title="Edit this message and resend"
          aria-label="Edit message"
          className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 group-hover:opacity-100 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a1 1 0 0 1-.44.256l-3 .857a.5.5 0 0 1-.618-.618l.857-3a1 1 0 0 1 .256-.44l8.617-8.383z" />
          </svg>
        </button>
      )}
      {!isUser && onRegenerate && (
        <button
          onClick={onRegenerate}
          title="Regenerate this response"
          aria-label="Regenerate response"
          className="order-last rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 group-hover:opacity-100 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10a6 6 0 0 1 10.5-4M16 10a6 6 0 0 1-10.5 4" />
            <path d="M14 3v3.5h-3.5M6 17v-3.5h3.5" />
          </svg>
        </button>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-zinc-900 to-zinc-700 text-zinc-50 dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900"
            : "border border-zinc-200/70 bg-white/80 text-zinc-900 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-900/80 dark:text-zinc-100"
        }`}
      >
        {message.imagePreview && (
          <img
            src={message.imagePreview}
            alt="Attached"
            className="mb-2 max-h-48 rounded-lg border border-white/20"
          />
        )}
        {message.toolCalls?.map((tc) => <ToolCallCard key={tc.id} call={tc} />)}
        {message.text &&
          (isUser ? (
            <p className="whitespace-pre-wrap">{message.text}</p>
          ) : isPlainProse ? (
            <p className="whitespace-pre-wrap">{shownText}</p>
          ) : (
            <Markdown text={message.text} />
          ))}
        {timeLabel && (
          <div
            className={`mt-1 text-[10px] font-medium ${
              isUser ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {timeLabel}
          </div>
        )}
      </div>
    </motion.div>
  );
}
