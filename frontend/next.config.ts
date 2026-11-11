import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Serve images directly instead of through Vercel's image optimizer.
    // The plan's optimization quota ran out and uncached images returned
    // 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED (broken fundraiser banners).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zrpllsbiklrzsufbbumw.supabase.co", // dev supabase
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "zrqmplfsrshsdockyyjt.supabase.co", // prod supabase
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https", 
        hostname: "images.unsplash.com", // TODO: remove this once images are all uploaded to Supabase
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com", // TODO: remove this once images are all uploaded to Supabase
      },
    ],
  },
};

export default nextConfig;
