/** @type {import('next').NextConfig} */
const apiTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:4000";

const nextConfig = {
  images: {
    // Optimized image responses cache for 31 days (default is 60s), so the
    // server doesn't re-encode banners on every visit.
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      {
        // Static marketing assets are effectively immutable between deploys —
        // without this, Next serves public/ files with max-age=0 and every
        // repeat view revalidates each image.
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
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
