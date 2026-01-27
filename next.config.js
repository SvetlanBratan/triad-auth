
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["https://6000-firebase-studio-1753179014285.cluster-c23mj7ubf5fxwq6nrbev4ugaxa.cloudworkstations.dev"],
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.placehold.co',
      },
      {
        protocol: 'https',
        hostname: '*.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: '*.userapi.com',
      },
      {
        protocol: 'https',
        hostname: '*.storage.yandex.net',
      },
    ],
  },
};

module.exports = nextConfig;
