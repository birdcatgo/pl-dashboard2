/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@radix-ui/react-select', 'lucide-react'],
  webpack: (config) => {
    // Simple configuration to reduce unnecessary rebuilds
    config.watchOptions = {
      ignored: ['**/node_modules', '**/.next'],
      aggregateTimeout: 300,
      poll: false,
    };
    return config;
  },
  fastRefresh: false,
}

module.exports = nextConfig