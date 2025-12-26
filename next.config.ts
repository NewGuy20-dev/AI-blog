import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "convex-api",
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
        },
      },
      {
        urlPattern: /\/_next\/image\?url=.+/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-images",
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
      {
        urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "unsplash-images",
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-images",
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.openverse.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.wikimedia.org" },
      { protocol: "https", hostname: "**.flickr.com" },
      { protocol: "https", hostname: "live.staticflickr.com" },
      { protocol: "https", hostname: "s.gravatar.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.auth0.com" },
    ],
  },
};

export default withPWA(nextConfig);
