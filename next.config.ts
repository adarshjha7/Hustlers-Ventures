import type { NextConfig } from "next";

// Directives are joined into a single header value
const cspDirectives = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for hydration scripts.
  // 'wasm-unsafe-eval' allows WebAssembly.compile/instantiate (needed for
  // ffmpeg.wasm client-side video compression on the broadcasts admin page).
  // 'unsafe-eval' is also required in production (not just dev) — it's
  // ffmpeg.wasm's own worker.js that needs it: that file does
  // `import(_coreURL)` with a runtime-computed blob: URL, which Turbopack
  // can't statically bundle (errors "expression is too dynamic"). The
  // patched copy (patches/@ffmpeg+ffmpeg+*.patch) routes that import
  // through `new Function(...)` so Turbopack never sees a literal import()
  // to analyze — but constructing a function from a string is itself
  // gated by 'unsafe-eval', so it has to be allowed everywhere this
  // feature needs to run, not just in dev. Scope note: this only executes
  // inside the ffmpeg.wasm worker, and only the guardAdmin()-gated
  // broadcasts page ever loads it.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval'`,
  // Tailwind + Recharts use inline styles; Google Fonts stylesheet
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Google Fonts files
  "font-src 'self' https://fonts.gstatic.com",
  // Self-hosted images, base64, blob (jsPDF downloads), and Supabase storage
  "img-src 'self' data: blob: https:",
  // API calls: Supabase REST + realtime WebSocket, EmailJS
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.emailjs.com",
  // ffmpeg.wasm runs its core in a Web Worker loaded from a same-origin
  // blob: URL (see src/lib/videoCompress.ts)
  "worker-src 'self' blob:",
  // Google Maps iframe embeds
  "frame-src 'self' https://www.google.com",
  // Disallow plugins (Flash etc.)
  "object-src 'none'",
  // Prevent base tag hijacking
  "base-uri 'self'",
  // Only allow forms to submit to same origin
  "form-action 'self'",
  // Upgrade HTTP requests to HTTPS
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Without a matching remotePattern, next/image can't optimize a remote
    // URL at all — several <Image> usages were marked `unoptimized` to work
    // around that, which means the browser downloads the raw, full-size
    // file with no resizing/WebP conversion/responsive srcset. Whitelisting
    // our own known hosts here lets us remove `unoptimized` from the ones
    // we control (Supabase Storage, Google Drive gallery photos) — real
    // image compression and correctly-sized delivery instead of shipping
    // full-resolution originals to every visitor.
    remotePatterns: [
      { protocol: "https", hostname: "pbyxgewnpnqhfdxuqwke.supabase.co" }, // Supabase Storage (broadcast images/videos/pdfs, opportunity assets)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },        // Google Drive opportunity photo galleries
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
