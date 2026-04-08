/** @type {import('next').NextConfig} */
const nextConfig = {
  // Public env vars baked into the build (safe — these are anon/public keys)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://mqvdhpnvepwogjhwdbek.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xdmRocG52ZXB3b2dqaHdkYmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5ODkyOTAsImV4cCI6MjA4OTU2NTI5MH0.YN4hrq_0OqzoAJ2268tdl0VFQvuAZaEIBLZZFGAgnDY",
    // NestJS API deployed on Railway
    NEXT_PUBLIC_API_URL: "https://api-production-cdfb.up.railway.app/api/v1",
  },

  // Enable raw body for Paystack webhook signature verification
  experimental: {},

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  // Strict security headers on every response
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
