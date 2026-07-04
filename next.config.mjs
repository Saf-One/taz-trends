/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public bucket. Host comes from the project URL.
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
