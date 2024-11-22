import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["geist"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
