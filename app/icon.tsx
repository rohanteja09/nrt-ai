import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "linear-gradient(135deg, #2563eb, #1e3a8a, #09090b)",
        }}
      >
        <svg width="21" height="21" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="2.2" fill="white" />
          <ellipse cx="12" cy="12" rx="9" ry="4" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" />
          <circle cx="21" cy="12" r="1.6" fill="#22d3ee" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
