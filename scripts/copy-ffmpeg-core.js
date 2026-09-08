// Copies the ffmpeg.wasm core (UMD build) from node_modules into public/ffmpeg/
// so the browser can load it same-origin — avoids depending on a third-party
// CDN at runtime and keeps CSP tight (no extra connect-src entries needed).
// Runs automatically via the "postinstall" npm script, so it's regenerated
// on every `npm install` (including Vercel's build) rather than committed.
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "node_modules", "@ffmpeg", "core", "dist", "umd");
const DEST_DIR = path.join(__dirname, "..", "public", "ffmpeg");
const FILES = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

if (!fs.existsSync(SRC_DIR)) {
  console.warn("[copy-ffmpeg-core] @ffmpeg/core not found in node_modules — skipping (video compression will be unavailable).");
  process.exit(0);
}

fs.mkdirSync(DEST_DIR, { recursive: true });

for (const file of FILES) {
  const src = path.join(SRC_DIR, file);
  const dest = path.join(DEST_DIR, file);
  if (!fs.existsSync(src)) {
    console.warn(`[copy-ffmpeg-core] Missing expected file: ${src}`);
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log(`[copy-ffmpeg-core] Copied ${file} -> public/ffmpeg/`);
}
