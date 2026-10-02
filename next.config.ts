import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sharp must be excluded from webpack bundling so its native binaries are loaded at runtime.
  // In Next 15+, this option lives at the top level (not under experimental).
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
