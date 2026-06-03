import type { NextConfig } from "next";

const apiProxyTarget = (
  process.env.API_PROXY_TARGET || "https://api-production-0b30.up.railway.app"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
