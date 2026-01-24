/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  async redirects() {
    return [
      { source: '/auth/login', destination: '/login', permanent: false },
      { source: '/auth/signup', destination: '/signup', permanent: false },
    ];
  },
};

export default config;
