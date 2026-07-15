const STORAGE_KEY = "nrt-device-id";

// A stable per-browser ID, persisted in localStorage, sent as the
// x-nrt-device header so the rate limiter can tell apart two visitors who
// share one public IP (same WiFi, or a mobile carrier's shared NAT).
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return "no-storage";
  }
}
