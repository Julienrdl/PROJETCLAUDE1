import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', '@libsql/client'],
  experimental: {
    turbo: {
      rules: {}
    }
  }
};

export default nextConfig;
