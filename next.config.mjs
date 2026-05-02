/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.replit.dev', '*.replit.app', '*.riker.replit.dev'],
  webpack: (config) => {
    config.output = config.output || {};
    config.output.chunkLoadTimeout = 120000;
    return config;
  },
  images: {
    // Кастомный Cloudinary loader для оптимизации на CDN
    loader: 'custom',
    loaderFile: './cloudinary-loader.js',
    
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

export default nextConfig;
