import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: '/team',
        destination: '/capacity/utilization',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
