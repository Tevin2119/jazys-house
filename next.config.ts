import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * `'unsafe-inline'` is required for scripts and styles because Next.js injects
 * inline bootstrap/hydration scripts and next/font + Tailwind emit inline
 * styles, and we do not (yet) run a nonce-emitting middleware. Tightening this
 * to a nonce-based policy is a tracked follow-up (see docs / phase-6 summary).
 *
 * `img-src` mirrors `images.remotePatterns` below (Vercel Blob + Cloudinary)
 * plus data:/blob: for inline + canvas-generated images. `frame-ancestors`
 * replaces X-Frame-Options for modern browsers; we keep both for coverage.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin file-tracing to this project — a stray parent lockfile would otherwise
  // make Next infer the wrong workspace root.
  outputFileTracingRoot: import.meta.dirname,
  images: {
    // Product images will be served from a blob/CDN host in later phases.
    // Add remote hosts here as they are introduced (Vercel Blob, Cloudinary).
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
