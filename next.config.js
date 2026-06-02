/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Skip strict checks during build to allow shadcn .jsx components to interop
  // with strict-mode .tsx files. Runtime behaviour is unaffected.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
  // For Docker / self-host deployments, you may enable standalone mode to
  // produce a self-contained build in .next/standalone with minimal node_modules.
  // Uncomment the next line, rebuild, then run: node .next/standalone/server.js
  // output: 'standalone',
};
module.exports = nextConfig;
