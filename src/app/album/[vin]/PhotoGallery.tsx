"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Photo = {
  id: string;
  public_url: string;
  is_cover: boolean;
  caption: string | null;
};

export default function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);

  const showPrev = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + photos.length) % photos.length,
    );
  }, [photos.length]);

  const showNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, close, showPrev, showNext]);

  if (photos.length === 0) return null;

  const coverIndex = Math.max(
    photos.findIndex((p) => p.is_cover),
    0,
  );
  const cover = photos[coverIndex];
  const others = photos.filter((_, i) => i !== coverIndex);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) showPrev();
    else if (delta < -50) showNext();
    touchStartX.current = null;
  }

  const active = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover.public_url}
        alt={cover.caption ?? ""}
        onClick={() => setLightboxIndex(coverIndex)}
        className="mb-4 h-64 w-full cursor-pointer rounded-md object-cover transition hover:opacity-90"
      />

      {others.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {others.map((photo) => {
            const index = photos.findIndex((p) => p.id === photo.id);
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.public_url}
                alt={photo.caption ?? ""}
                onClick={() => setLightboxIndex(index)}
                className="h-24 w-full cursor-pointer rounded object-cover transition hover:opacity-80"
              />
            );
          })}
        </div>
      )}

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 text-3xl font-bold text-white transition hover:text-gold"
            aria-label="Close"
          >
            &times;
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              className="absolute left-2 text-4xl font-bold text-white transition hover:text-gold sm:left-6"
              aria-label="Previous photo"
            >
              &#8249;
            </button>
          )}

          <div
            className="flex max-h-full max-w-full flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.public_url}
              alt={active.caption ?? ""}
              className="max-h-[80vh] max-w-full rounded-md object-contain"
            />
            <div className="mt-3 text-center text-white">
              {active.caption && <p className="text-sm">{active.caption}</p>}
              {photos.length > 1 && (
                <p className="mt-1 text-xs text-brandgrey">
                  {lightboxIndex! + 1} / {photos.length}
                </p>
              )}
            </div>
          </div>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              className="absolute right-2 text-4xl font-bold text-white transition hover:text-gold sm:right-6"
              aria-label="Next photo"
            >
              &#8250;
            </button>
          )}
        </div>
      )}
    </>
  );
}
