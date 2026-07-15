"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import CopyButton from "./CopyButton";
import HighlightedCode from "./HighlightedCode";

export default function CodeSandbox({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.data?.__nrtSandbox) setOutput(e.data.logs);
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  function run() {
    setRan(true);
    setOutput([]);
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const escaped = code.replace(/<\/script>/g, "<\\/script>");
    doc.open();
    doc.write(`<script>
      const logs = [];
      ["log","error","warn","info"].forEach((m) => {
        console[m] = (...args) => {
          logs.push(args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
        };
      });
      try {
        ${escaped}
      } catch (e) {
        logs.push("Error: " + e.message);
      }
      parent.postMessage({ __nrtSandbox: true, logs }, "*");
    <\/script>`);
    doc.close();
  }

  return (
    <div className="my-2 rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-orange-500/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {"\u{1F4BB}"} Code sandbox (runs in your browser only)
        </span>
        <div className="flex items-center gap-1.5">
          <CopyButton text={code} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={run}
            className="rounded-md bg-gradient-to-br from-blue-700 to-zinc-950 px-2.5 py-1 text-xs font-medium text-white"
          >
            {ran ? "Run again" : "Run"}
          </motion.button>
        </div>
      </div>
      <HighlightedCode code={code} lang="javascript" />
      {output.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 rounded-lg bg-black p-2.5 font-mono text-xs text-emerald-400"
        >
          {output.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </motion.div>
      )}
      <iframe ref={iframeRef} sandbox="allow-scripts" className="hidden" title="nrt-ai code sandbox" />
    </div>
  );
}
