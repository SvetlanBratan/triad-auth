
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.imagekit.io',
      },
    ],
  },
  experimental: {
    // This allows requests from any origin in development, which is useful for
    // cloud-based development environments like Firebase Studio.
    allowedDevOrigins: ["*"],
  },
};

module.exports = nextConfig;
