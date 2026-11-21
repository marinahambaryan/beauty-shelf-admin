import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Catalogue images are capped at 2 MB by the storage bucket; leave room for the form around them.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
