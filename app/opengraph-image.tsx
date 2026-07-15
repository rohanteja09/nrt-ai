import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 68% 42%, #0b1330 0%, #04070f 55%, #000103 100%)",
          position: "relative",
        }}
      >
        {/* orbit rings */}
        <div
          style={{
            position: "absolute",
            width: 620,
            height: 620,
            borderRadius: "50%",
            border: "1.5px solid rgba(96,165,250,0.35)",
            right: -160,
            top: -120,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 460,
            height: 460,
            borderRadius: "50%",
            border: "1px solid rgba(34,211,238,0.3)",
            right: -80,
            top: -40,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 340,
            height: 340,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #3b82f6, #0b1e4d 65%, #04070f 100%)",
            boxShadow: "0 0 90px 10px rgba(59,130,246,0.35)",
            right: 40,
            top: 60,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: 760,
            paddingLeft: 90,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 68,
                height: 68,
                borderRadius: 18,
                background: "linear-gradient(135deg, #2563eb, #1e3a8a, #09090b)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="42" height="42" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2.2" fill="white" />
                <ellipse cx="12" cy="12" rx="9" ry="4" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.1" />
                <circle cx="21" cy="12" r="1.6" fill="#22d3ee" />
              </svg>
            </div>
            <div style={{ display: "flex", fontSize: 54, fontWeight: 700, color: "white" }}>NRT AI</div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.4,
              color: "#cbd5e1",
              maxWidth: 620,
            }}
          >
            A free, always-on AI assistant — chat, search, browse, generate images, and run code.
          </div>

          <div style={{ display: "flex", marginTop: 40, fontSize: 22, color: "#60a5fa" }}>
            nrt-ai.rohan-nallapaneni.workers.dev
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
