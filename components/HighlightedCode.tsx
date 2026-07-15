"use client";

import { Highlight, themes } from "prism-react-renderer";

const SUPPORTED_LANGS = new Set([
  "markup", "html", "xml", "svg", "bash", "shell", "sh", "c", "cpp", "css",
  "javascript", "js", "jsx", "json", "markdown", "md", "python", "py", "sql",
  "typescript", "ts", "tsx", "yaml", "yml", "go", "graphql", "diff",
]);

export default function HighlightedCode({ code, lang = "" }: { code: string; lang?: string }) {
  const language = SUPPORTED_LANGS.has(lang) ? lang : "tsx";
  return (
    <Highlight theme={themes.vsDark} code={code} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={`${className} overflow-x-auto rounded-lg p-3 text-xs leading-relaxed`} style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
