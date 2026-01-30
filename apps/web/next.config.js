/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://eqb-coworker-platform.onrender.com',
  },
  async redirects() {
    return [
      { source: '/auth/login', destination: '/login', permanent: false },
      { source: '/auth/signup', destination: '/signup', permanent: false },
    ];
  },
};

export default config;
