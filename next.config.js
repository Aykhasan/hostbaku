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
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components/ui': path.resolve(__dirname, 'src/components/ui.tsx'),
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
