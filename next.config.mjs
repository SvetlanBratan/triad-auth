/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This allows the Next.js dev server to be accessed from the Firebase Studio preview URL.
    allowedDevOrigins: ["*.cloudworkstations.dev"],
  },
};

export default nextConfig;
