/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  generateBuildId: async () => 'house-of-shubhanshi-build',
  async rewrites() {
    const rawBackend = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      process.env.INTERNAL_API_URL ||
      ''
    ).trim().replace(/\/$/, '');

    const isLocalhost = !rawBackend || rawBackend.includes('localhost') || rawBackend.includes('127.0.0.1');

    // In local development, if local Express server is used, proxy to it
    if (process.env.NODE_ENV !== 'production') {
      const target = rawBackend || 'http://localhost:3001';
      return [
        {
          source: '/api/:path*',
          destination: `${target}/api/:path*`,
        },
      ];
    }

    // In production (Vercel / Cloud):
    // Only rewrite if an explicit public remote URL (https://...) is provided.
    // Rewriting to localhost on Vercel is strictly blocked with DNS_HOSTNAME_RESOLVED_PRIVATE (404).
    if (!isLocalhost && (rawBackend.startsWith('https://') || rawBackend.startsWith('http://'))) {
      return [
        {
          source: '/api/:path*',
          destination: `${rawBackend}/api/:path*`,
        },
      ];
    }

    // Otherwise, native Next.js App Router API routes in app/api/... will serve all requests directly!
    return [];
  },
};

module.exports = nextConfig;
