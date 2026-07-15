"use client";

import { motion } from "framer-motion";

export default function Logo({ size = 32, animateIn = false }: { size?: number; animateIn?: boolean }) {
  return (
    <motion.div
      initial={animateIn ? { opacity: 0, scale: 0.6 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-900 to-zinc-950 shadow-sm"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.64} height={size * 0.64}>
        <motion.ellipse
          cx="12"
          cy="12"
          rx="9"
          ry="4"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.1"
          initial={animateIn ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.65, ease: "easeInOut", delay: 0.1 }}
        />
        <motion.circle
          cx="12"
          cy="12"
          r="2.2"
          fill="white"
          style={{ transformOrigin: "12px 12px" }}
          initial={animateIn ? { opacity: 0, scale: 0 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.55 }}
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
    </motion.div>
  );
}
