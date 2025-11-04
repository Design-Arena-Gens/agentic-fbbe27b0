/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    esmExternals: true,
    serverActions: {
      allowedOrigins: ['agentic-fbbe27b0.vercel.app', 'localhost']
    }
  },
};

export default nextConfig;
