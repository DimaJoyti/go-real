/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      // Cloudflare domains
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
      {
        protocol: 'https',
        hostname: 'goreal.com',
      },
      {
        protocol: 'https',
        hostname: 'files.goreal.com',
      },
      {
        protocol: 'https',
        hostname: 'dev-files.goreal.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ETHEREUM_NETWORK: process.env.NEXT_PUBLIC_ETHEREUM_NETWORK,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_GO_API_URL: process.env.NEXT_PUBLIC_GO_API_URL,
    // Cloudflare Workers URLs
    NEXT_PUBLIC_WORKERS_URL: process.env.NEXT_PUBLIC_WORKERS_URL,
    NEXT_PUBLIC_FILES_URL: process.env.NEXT_PUBLIC_FILES_URL,
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  async rewrites() {
    const workersUrl = process.env.NEXT_PUBLIC_WORKERS_URL || 'http://localhost:8787';
    const goApiUrl = process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:8080';

    return [
      // Cloudflare Workers API routes
      {
        source: '/api/workers/:path*',
        destination: `${workersUrl}/api/:path*`,
      },
      // Direct Go backend routes (fallback)
      {
        source: '/api/go/:path*',
        destination: `${goApiUrl}/api/:path*`,
      },
      // Proxy some routes through Workers for caching
      {
        source: '/api/cached/:path*',
        destination: `${workersUrl}/api/proxy/:path*`,
      },
    ];
  },
  // Cloudflare Pages configuration
  trailingSlash: false,
};

module.exports = nextConfig;
