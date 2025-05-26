/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/images/:path*",      // when user requests /images/filename.jpg
        destination: "/uploads/:path*", // serve it from /public/uploads/filename.jpg
      },
    ];
  },
};

export default nextConfig;
