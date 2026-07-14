export default function OrbitSpinner({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="2" className="fill-current opacity-70" />
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="4"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.2"
      />
      <circle cx="21" cy="12" r="1.5" className="fill-current">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="1.1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
