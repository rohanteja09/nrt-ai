import type { ChatMessage } from "./types";

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

const LIST_KEY = "nrt-conversations";
const ACTIVE_KEY = "nrt-active-conversation";

// Fired whenever the persisted conversation list changes (save/delete/clear),
// so the sidebar can refresh its list. Chat.tsx never listens to this one —
// only Chat.tsx writes conversations, so it doesn't need to react to its own
// writes. This keeps the two components from ever feeding back into a loop.
export const HISTORY_EVENT = "nrt-history-changed";
// Fired whenever the active conversation id changes, by whoever changed it
// (Sidebar on click, Chat.tsx on initial load) — the other side listens to
// stay in sync.
export const ACTIVE_CONVERSATION_EVENT = "nrt-active-conversation-changed";
// Dispatched by the sidebar (new chat / switch / delete-the-active-one) to
// ask Chat.tsx to load a given conversation id (possibly one that doesn't
// exist yet, which just means "start empty").
export const SWITCH_CONVERSATION_EVENT = "nrt-switch-conversation";

function readAll(): Conversation[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: Conversation[]) {
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable (private mode, quota) — history just won't persist
  }
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function listConversations(): Conversation[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): Conversation | null {
  return readAll().find((c) => c.id === id) ?? null;
}

function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user" && m.text)?.text.trim();
  if (!firstUser) return "New chat";
  return firstUser.length > 42 ? `${firstUser.slice(0, 42)}…` : firstUser;
}

export function saveConversation(id: string, messages: ChatMessage[]) {
  if (messages.length === 0) return; // don't persist empty threads
  const list = readAll();
  const idx = list.findIndex((c) => c.id === id);
  const conv: Conversation = { id, title: deriveTitle(messages), messages, updatedAt: Date.now() };
  if (idx === -1) list.push(conv);
  else list[idx] = conv;
  writeAll(list);
}

export function deleteConversation(id: string) {
  writeAll(readAll().filter((c) => c.id !== id));
}

export function clearAllConversations() {
  writeAll([]);
}

export function createConversationId(): string {
  return crypto.randomUUID();
}

export function getStoredActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setStoredActiveId(id: string) {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // storage unavailable — active thread just won't survive a reload
  }
}
