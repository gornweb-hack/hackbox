import type { NextConfig } from "next";

// Адрес ядра. Rewrites фиксируются при сборке: в Docker он передаётся как build-аргумент
const coreUrl = process.env.CORE_URL ?? "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  output: "standalone",
  // Сжатие придерживает потоковые ответы, а SSE (/api/stream) должен приходить сразу
  compress: false,
  poweredByHeader: false,
  // Фронт и API на одном адресе: cookie входа и EventSource работают без CORS
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${coreUrl}/api/:path*` }];
  },
};

export default nextConfig;
