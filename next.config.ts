import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // lucide-react barrel file import 최적화 (bundle-barrel-imports)
  // https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
  experimental: {
    optimizePackageImports: ['lucide-react']
  },

  // 프로덕션 빌드 시 console 제거
  // logger 유틸리티를 통해 개발 환경에서만 로그가 출력되지만,
  // 추가적인 최적화를 위해 빌드 시에도 console 호출을 제거합니다.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error'] // critical error는 유지
          }
        : false
  }
};

export default nextConfig;
