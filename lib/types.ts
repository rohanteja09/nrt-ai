export type ToolKind = "search" | "browse" | "image" | "code";

export interface ToolCall {
  id: string;
  kind: ToolKind;
  label: string;
  detail?: string;
  imageUrl?: string;
  status: "running" | "done";
  /** Source links behind a web_search result, surfaced separately from the model's prose citations. */
  sources?: { title: string; url: string }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolCalls?: ToolCall[];
  imagePreview?: string;
  timestamp?: number;
  /** Populated via real token streaming — MessageBubble skips its fake typewriter reveal for these, since the text is already arriving incrementally. */
  streamed?: boolean;
}
