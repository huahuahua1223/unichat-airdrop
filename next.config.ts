import type { NextConfig } from "next";

// 判断是否使用Turbopack
const isTurbopack = process.env.NEXT_TURBO === '1';

const nextConfig: NextConfig = {
  /* 通用配置 */
  eslint: {
    // 在生产构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在生产构建时忽略TypeScript错误
    ignoreBuildErrors: true,
  },
  
  // Webpack配置 (仅在非Turbopack模式下使用)
  ...(isTurbopack ? {} : {
    webpack: (config) => {
      // 忽略特定模块的警告
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': require.resolve('./app/utils/asyncStorageMock.ts'),
      };
      return config;
    },
  }),
  
  // Turbopack配置
  turbopack: {
    resolveAlias: {
      '@react-native-async-storage/async-storage': './app/utils/asyncStorageMock.ts',
    },
  },
};

export default nextConfig;
