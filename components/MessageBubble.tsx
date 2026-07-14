"use client";

import { motion } from "framer-motion";
import ToolCallCard from "./ToolCallCard";
import CodeSandbox from "./CodeSandbox";
import { useTypewriter } from "@/lib/useTypewriter";
import { hasCodeFence, parseSegments } from "@/lib/parseMessage";
import type { ChatMessage } from "@/lib/types";

export default function MessageBubble({
  message,
  animateText,
}: {
  message: ChatMessage;
  animateText: boolean;
}) {
  const isUser = message.role === "user";
  const containsCode = !isUser && hasCodeFence(message.text);
  const shownText = useTypewriter(message.text, animateText && !isUser && !containsCode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-zinc-900 to-zinc-700 text-zinc-50 dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900"
            : "border border-zinc-200/70 bg-white/70 text-zinc-900 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-900/70 dark:text-zinc-100"
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
        {containsCode ? (
          parseSegments(message.text).map((seg, i) =>
            seg.type === "code" ? (
              <CodeSandbox key={i} code={seg.content} />
            ) : seg.content.trim() ? (
              <p key={i} className="whitespace-pre-wrap">
                {seg.content.trim()}
              </p>
            ) : null
          )
        ) : (
          message.text && <p className="whitespace-pre-wrap">{shownText}</p>
        )}
      </div>
    </motion.div>
  );
}
