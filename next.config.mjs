/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: "/assets/:path*", destination: "/spa/assets/:path*" },
      { source: "/manifest.json", destination: "/spa/manifest.json" },
    ];
  },
};

export default nextConfig;
