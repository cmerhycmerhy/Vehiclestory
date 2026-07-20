"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Photo = {
  id: string;
  public_url: string;
  is_cover: boolean;
  caption: string | null;
};

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
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
      <div className="overflow-hidden rounded-xl border border-brandgrey/30 bg-navy shadow-sm">
        <button
          type="button"
          onClick={() => setLightboxIndex(coverIndex)}
          className="group relative block aspect-[3/2] w-full overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover.public_url}
            alt={cover.caption ?? ""}
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-navy/0 opacity-0 transition duration-300 group-hover:bg-navy/30 group-hover:opacity-100">
            <span className="rounded-full bg-white/95 p-3 text-navy shadow-lg">
              <ExpandIcon />
            </span>
          </div>
        </button>

        {others.length > 0 && (
          <div className="flex gap-[3px] overflow-x-auto bg-navy p-[3px]">
            {others.map((photo) => {
              const index = photos.findIndex((p) => p.id === photo.id);

              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="group relative aspect-square w-[22%] shrink-0 overflow-hidden sm:w-[18%]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.public_url}
                    alt={photo.caption ?? ""}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-110 group-hover:opacity-90"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy/95 p-4 backdrop-blur-sm"
          onClick={close}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <CloseIcon />
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
              aria-label="Previous photo"
            >
              <ChevronLeftIcon />
            </button>
          )}

          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex max-h-[65vh] w-full items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.public_url}
                alt={active.caption ?? ""}
                className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
            </div>

            <div className="mt-4 text-center text-white">
              {active.caption && (
                <p className="text-sm text-white/90">{active.caption}</p>
              )}
              {photos.length > 1 && (
                <p className="mt-1 text-xs text-brandgrey">
                  {lightboxIndex! + 1} / {photos.length}
                </p>
              )}
            </div>

            {photos.length > 1 && (
              <div className="mt-4 flex max-w-full gap-2 overflow-x-auto px-1 pb-1">
                {photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(i);
                    }}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition ${
                      i === lightboxIndex
                        ? "border-gold"
                        : "border-transparent opacity-50 hover:opacity-90"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.public_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
              aria-label="Next photo"
            >
              <ChevronRightIcon />
            </button>
          )}
        </div>
      )}
    </>
  );
}
