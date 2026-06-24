import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-markdown', 'remark-gfm'],
  output: 'standalone',
  allowedDevOrigins: ['10.250.148.114'],
};

export default nextConfig;
