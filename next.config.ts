import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.promediateknologi.id',
      },
      {
        protocol: 'https',
        hostname: 'monitorday.com',
      },
      {
        protocol: 'https',
        hostname: 'infopublik.id',
      },
      {
        protocol: 'https',
        hostname: 'www.nusabali.com',
      },
      {
        protocol: 'https',
        hostname: 'i1.wp.com',
      },
      {
        protocol: 'https',
        hostname: 'www.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'qjfuebkxlnnrdjgakdrm.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'image.astronauts.cloud',
      },
      {
        protocol: 'https',
        hostname: 'down-id.img.susercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'desagrogol.gunungkidulkab.go.id',
      },
    ],
  },
};

export default nextConfig;
