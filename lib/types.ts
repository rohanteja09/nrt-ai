export type ToolKind = "search" | "browse" | "image" | "code";

export interface ToolCall {
  id: string;
  kind: ToolKind;
  label: string;
  detail?: string;
  imageUrl?: string;
  status: "running" | "done";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolCalls?: ToolCall[];
  imagePreview?: string;
}
