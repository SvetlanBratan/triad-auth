/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is a workaround for a file watching issue in some environments.
    instrumentationHook: false,
  },
  watchOptions: {
    // Ignoring the config file should prevent the restart loop.
    ignored: ['**/.next/**', '**/node_modules/**', '**/next.config.mjs'],
  },
  devIndicators: {
    allowedDevOrigins: ['*.cloudworkstations.dev'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

export default nextConfig;
