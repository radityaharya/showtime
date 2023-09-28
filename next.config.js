/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
    ],
    minimumCacheTTL: 60,
  },
};

module.exports = nextConfig;
