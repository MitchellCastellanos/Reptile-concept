import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "reptiles-concept.com" }],
        destination: "https://reptiles-concept.ca/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.reptiles-concept.com" }],
        destination: "https://reptiles-concept.ca/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.reptiles-concept.ca" }],
        destination: "https://reptiles-concept.ca/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
