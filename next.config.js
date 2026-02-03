
/** @type {import('next').NextConfig} */
const nextConfig = {
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
