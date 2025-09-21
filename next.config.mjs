/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Increase body size limit for API routes (default is 1MB)
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  // Alternative way to set body size limit
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default nextConfig;