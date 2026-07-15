import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Only needed for `next dev` (gives API routes access to Cloudflare bindings
// locally); running it during `next build` tries to reach Cloudflare and
// fails on CI runners with no wrangler session.
if (process.env.NEXT_PHASE === "phase-development-server") {
  import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
}
