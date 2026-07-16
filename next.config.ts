import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Photo uploads go through a Server Action (uploadPhoto); the
      // dropzone accepts files up to 10mb, so leave headroom for
      // multipart overhead on top of that.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
