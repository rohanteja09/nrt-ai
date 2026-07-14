export interface MessageSegment {
  type: "text" | "code";
  content: string;
  lang?: string;
}

const FENCE_RE = /```(\w*)\n([\s\S]*?)```/g;

export function hasCodeFence(text: string): boolean {
  return /```/.test(text);
}

export function parseSegments(text: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  FENCE_RE.lastIndex = 0;
  while ((match = FENCE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "code", content: match[2].trim(), lang: match[1] || undefined });
    lastIndex = FENCE_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }
  return segments;
}
