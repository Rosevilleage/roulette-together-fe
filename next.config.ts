import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // lucide-react barrel file import 최적화 (bundle-barrel-imports)
  // https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
};

export default nextConfig;
