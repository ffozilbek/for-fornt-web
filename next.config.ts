import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
      { source: "/zones", destination: "http://localhost:5000/zones" },
    ];
  },
};

export default nextConfig;
