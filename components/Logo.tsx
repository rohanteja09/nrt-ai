export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-900 to-zinc-950 shadow-sm"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.64} height={size * 0.64}>
        <circle cx="12" cy="12" r="2.2" fill="white" />
        <ellipse
          cx="12"
          cy="12"
          rx="9"
          ry="4"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.1"
        />
        <circle cx="21" cy="12" r="1.5" fill="#22d3ee">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
