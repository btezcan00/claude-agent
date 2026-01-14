import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/cases',
        destination: '/signals',
        permanent: true,
      },
      {
        source: '/cases/:id',
        destination: '/signals/:id',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
