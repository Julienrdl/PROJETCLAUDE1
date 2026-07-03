import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', '@libsql/client'],
};

export default nextConfig;
