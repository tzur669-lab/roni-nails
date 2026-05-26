const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https" as const, hostname: "firebasestorage.googleapis.com" },
      { protocol: "https" as const, hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
