"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

interface GalleryImage { id: string; name: string; src: string; thumbnail: string; }

interface Props {
  folderId?: string;    // Google Drive folder ID
  staticUrls?: string[]; // local/static image paths
  title?: string;
}

export default function GallerySection({ folderId, staticUrls, title = "Gallery" }: Props) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (staticUrls && staticUrls.length > 0) {
      setImages(staticUrls.map((url, i) => ({ id: String(i), name: `Photo ${i + 1}`, src: url, thumbnail: url })));
      setLoading(false);
      return;
    }
    if (folderId) {
      fetch(`/api/opportunities/gallery?folderId=${folderId}`)
        .then(r => r.json())
        .then(d => setImages(d.images ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    setLoading(false);
  }, [folderId, staticUrls?.join(",")]);

  const prev = () => setLightbox(i => i != null ? (i - 1 + images.length) % images.length : null);
  const next = () => setLightbox(i => i != null ? (i + 1) % images.length : null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightbox == null) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, images.length]);

  if (!loading && images.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">{title}</h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-video bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ImageOff className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No photos available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setLightbox(i)}
                className="group relative aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 hover:border-[#05CE78]/40 hover:shadow-xl transition-all"
              >
                <Image
                  src={img.thumbnail}
                  alt={img.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox != null && images[lightbox] && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80 rounded-full p-3 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80 rounded-full p-3 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="relative w-full max-w-5xl max-h-[80vh] mx-8" onClick={e => e.stopPropagation()}>
            <Image
              src={images[lightbox].src}
              alt={images[lightbox].name}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </section>
  );
}
