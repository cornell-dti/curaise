import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zrpllsbiklrzsufbbumw.supabase.co",
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
