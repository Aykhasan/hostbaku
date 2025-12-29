/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config) => {
    // Ensure ui.tsx is resolved before ui directory
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components/ui': require('path').resolve(__dirname, 'src/components/ui.tsx'),
    };
    return config;
  },
};

module.exports = nextConfig;
