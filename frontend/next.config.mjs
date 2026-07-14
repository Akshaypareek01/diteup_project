/** @type {import('next').NextConfig} */
const apiTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:4000";

const nextConfig = {
  async redirects() {
    return [
      {
        source: "/orders/:orderNumber",
        destination: "/order/:orderNumber",
        permanent: true,
      },
      {
        source: "/refund-policy",
        destination: "/return-refund-policy",
        permanent: true,
      },
      {
        source: "/privacy",
        destination: "/privacy-policy",
        permanent: true,
      },
      {
        source: "/terms",
        destination: "/terms-conditions",
        permanent: true,
      },
    ];
  },
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
