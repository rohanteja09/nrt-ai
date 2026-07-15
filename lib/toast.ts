// Lightweight cross-component toast trigger, matching the same
// dispatch-a-window-event pattern already used for QUOTA_EVENT/SUGGEST_EVENT.
// Any component can call showToast(...) without prop-drilling; Chat.tsx owns
// the actual toast UI and listens for this event.
export const TOAST_EVENT = "nrt-toast";

export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }));
}
