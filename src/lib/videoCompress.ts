"use client";

// Client-side video compression using ffmpeg.wasm, so raw broadcast videos
// are shrunk (and their metadata moved to the front via +faststart, fixing
// "stuck at 0:00" playback stalls on large files) before they ever leave
// the admin's browser. Runs entirely client-side — no Vercel serverless
// function is involved, so there's no server-imposed time/size limit.
//
// The ffmpeg-core.js/.wasm files are self-hosted at /public/ffmpeg (copied
// from node_modules by scripts/copy-ffmpeg-core.js via the postinstall
// hook) rather than fetched from a CDN, to keep CSP tight and avoid a
// third-party runtime dependency.

import type { FFmpeg } from "@ffmpeg/ffmpeg";

// Files above this size are skipped — client-side compression of very large
// files risks exhausting the browser tab's memory (ffmpeg.wasm's single-
// threaded core loads the whole file into WASM memory). Uploads still work
// for these, just uncompressed.
const MAX_COMPRESSIBLE_BYTES = 600 * 1024 * 1024; // 600MB

const MAX_WIDTH = 1280; // cap resolution — plenty for an email/WhatsApp broadcast video
const CRF = 28;         // libx264 quality factor — lower = better quality/bigger file; 28 is a solid web-delivery default

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();
    const baseURL = "/ffmpeg";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadPromise;
}

export class VideoTooLargeToCompressError extends Error {
  constructor() {
    super("File is too large to compress in-browser — uploading as-is.");
    this.name = "VideoTooLargeToCompressError";
  }
}

export interface CompressVideoOptions {
  /** 0..1 encode progress, fires repeatedly during compression. */
  onProgress?: (ratio: number) => void;
  /** Fires once when the (~30MB) ffmpeg core is downloading/initializing — this only happens on the first compression per page load. */
  onStage?: (stage: "loading-engine" | "compressing") => void;
}

/**
 * Compresses a video File in the browser and returns a new, smaller
 * File (always re-muxed to MP4 with faststart). Throws
 * VideoTooLargeToCompressError for files over MAX_COMPRESSIBLE_BYTES —
 * callers should catch that specifically and fall back to uploading the
 * original file rather than treating it as a hard failure.
 */
export async function compressVideo(file: File, opts: CompressVideoOptions = {}): Promise<File> {
  if (file.size > MAX_COMPRESSIBLE_BYTES) {
    throw new VideoTooLargeToCompressError();
  }

  opts.onStage?.("loading-engine");
  const ffmpeg = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");

  const onProgressHandler = ({ progress }: { progress: number }) => {
    const clamped = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
    opts.onProgress?.(clamped);
  };
  ffmpeg.on("progress", onProgressHandler);

  opts.onStage?.("compressing");

  const ext = file.name.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ".mp4";
  const inputName = `input${ext}`;
  const outputName = "output.mp4";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      "-i", inputName,
      "-vf", `scale='min(${MAX_WIDTH},iw)':-2`,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", String(CRF),
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
    const blob = new Blob([bytes as BlobPart], { type: "video/mp4" });
    const compressedName = file.name.replace(/\.[a-zA-Z0-9]+$/, "") + "-compressed.mp4";
    return new File([blob], compressedName, { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", onProgressHandler);
    // Best-effort cleanup of ffmpeg's virtual filesystem; failures here
    // shouldn't surface as compression errors.
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
