/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Other experimental features can go here
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      }
    ],
  },
  // This is a top-level configuration, not under `experimental`
  allowedDevOrigins: ["https://*.cloudworkstations.dev"],
};

export default nextConfig;
