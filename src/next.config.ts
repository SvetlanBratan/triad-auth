
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // This is to allow the Next.js dev server to be proxied in the Studio editor.
  },
  // This is to allow the Next.js dev server to be proxied in the Studio editor.
  allowedDevOrigins: [
    '6000-firebase-studio-1753179014285.cluster-c23mj7ubf5fxwq6nrbev4ugaxa.cloudworkstations.dev',
  ],
};

export default nextConfig;
