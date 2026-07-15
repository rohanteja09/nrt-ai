"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeSandbox from "./CodeSandbox";
import CopyButton from "./CopyButton";

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="markdown-body space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            const codeEl = Array.isArray(children) ? children[0] : children;
            const className =
              (codeEl && typeof codeEl === "object" && "props" in codeEl
                ? (codeEl as { props: { className?: string } }).props.className
                : "") ?? "";
            const lang = /language-(\w+)/.exec(className)?.[1]?.toLowerCase() ?? "";
            const code = extractText(children).replace(/\n$/, "");

            if (lang === "js" || lang === "javascript") {
              return <CodeSandbox code={code} />;
            }
            return (
              <div className="group relative">
                <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs leading-relaxed text-zinc-100">
                  <code>{code}</code>
                </pre>
                <CopyButton text={code} className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            );
          },
          code({ children, className }) {
            if (className?.includes("language-")) {
              return <code className={className}>{children}</code>;
            }
            return (
              <code className="rounded bg-zinc-200/70 px-1 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800">
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 underline underline-offset-2 dark:text-blue-400"
              >
                {children}
              </a>
            );
          },
          ul({ children }) {
            return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal space-y-1 pl-5">{children}</ol>;
          },
          h1({ children }) {
            return <h3 className="text-base font-semibold">{children}</h3>;
          },
          h2({ children }) {
            return <h3 className="text-base font-semibold">{children}</h3>;
          },
          h3({ children }) {
            return <h4 className="text-sm font-semibold">{children}</h4>;
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-zinc-300 bg-zinc-100 px-2 py-1 text-left font-semibold dark:border-zinc-700 dark:bg-zinc-800">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="border border-zinc-300 px-2 py-1 dark:border-zinc-700">{children}</td>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
