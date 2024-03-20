/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: true,
  },
  images: {
    unoptimized: true,
    domains: [
      "user-images.githubusercontent.com",
      "s3.us-west-2.amazonaws.com",
      "res.cloudinary.com",
      "r2.radityaharya.com",
      "www.radityaharya.com",
      "radityaharya.com",
      "qnhjmybhvmffhqxsggxx.supabase.co",
      "www.themoviedb.org",
      "image.tmdb.org",
      "imgproxy.radityaharya.com",
    ],
    minimumCacheTTL: 60,
  },
};

if (process.env.SENTRY_DSN) {
  const { withSentryConfig } = require("@sentry/nextjs");
  console.log("Sentry enabled");

  module.exports = withSentryConfig(
    nextConfig,
    {
      silent: true,
      org: "raditya-harya",
      project: "showtime",
    },
    {
      widenClientFileUpload: true,
      transpileClientSDK: false,
      tunnelRoute: "/monitoring",
      hideSourceMaps: true,
      disableLogger: true,
    },
  );
} else {
  module.exports = nextConfig;
}
