/** @type {import('next').NextConfig} */
const apiTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:4000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${apiTarget.replace(/\/$/, "")}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
