export const ACCENT_STORAGE_KEY = "nrt-accent";
export const REDUCED_MOTION_STORAGE_KEY = "nrt-reduced-motion-override";

export type Accent = "blue" | "violet" | "emerald" | "rose" | "amber";
export const ACCENTS: Accent[] = ["blue", "violet", "emerald", "rose", "amber"];

// Fired whenever the reduced-motion override changes, so an already-mounted
// Globe3D scene can react live instead of only reading it once at setup.
export const REDUCED_MOTION_EVENT = "nrt-reduced-motion-changed";

export function getStoredAccent(): Accent {
  try {
    const v = localStorage.getItem(ACCENT_STORAGE_KEY);
    return (ACCENTS as string[]).includes(v ?? "") ? (v as Accent) : "blue";
  } catch {
    return "blue";
  }
}

export function setStoredAccent(accent: Accent) {
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {
    // storage unavailable — accent just won't persist across reloads
  }
  document.documentElement.setAttribute("data-accent", accent);
}

// null = follow the OS-level prefers-reduced-motion setting; true/false = an
// explicit in-app override, for people who want more (or less) motion than
// their system default without changing OS settings.
export function getReducedMotionOverride(): boolean | null {
  try {
    const v = localStorage.getItem(REDUCED_MOTION_STORAGE_KEY);
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  } catch {
    return null;
  }
}

export function setReducedMotionOverride(value: boolean | null) {
  try {
    if (value === null) localStorage.removeItem(REDUCED_MOTION_STORAGE_KEY);
    else localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, String(value));
  } catch {
    // storage unavailable — override just won't persist across reloads
  }
  window.dispatchEvent(new Event(REDUCED_MOTION_EVENT));
}

export function resolveReducedMotion(): boolean {
  const override = getReducedMotionOverride();
  if (override !== null) return override;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
