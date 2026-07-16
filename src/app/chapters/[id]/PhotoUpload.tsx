"use client";

import { useCallback, useState, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import {
  uploadPhoto,
  deletePhoto,
  setCoverPhoto,
  updatePhotoCaption,
  movePhoto,
} from "./actions";

type Photo = {
  id: string;
  public_url: string;
  is_cover: boolean;
  original_filename: string | null;
  caption?: string | null;
};

export default function PhotoUpload({
  chapterId,
  photos,
  onPhotosChange,
}: {
  chapterId: string;
  photos: Photo[];
  onPhotosChange: (update: (prev: Photo[]) => Photo[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const [pendingPhotoId, setPendingPhotoId] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      setError(null);
      accepted.forEach((file) => {
        const formData = new FormData();
        formData.set("photo", file);

        startUploadTransition(async () => {
          const result = await uploadPhoto(chapterId, formData);
          if ("error" in result) {
            setError(result.error);
            return;
          }
          onPhotosChange((prev) => [...prev, result.photo]);
        });
      });
    },
    [chapterId, onPhotosChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024,
    onDrop,
  });

  async function handleDelete(photoId: string) {
    setError(null);
    setPendingPhotoId(photoId);
    const result = await deletePhoto(chapterId, photoId);
    setPendingPhotoId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onPhotosChange((prev) => prev.filter((p) => p.id !== photoId));
  }

  async function handleSetCover(photoId: string) {
    setError(null);
    setPendingPhotoId(photoId);
    const result = await setCoverPhoto(chapterId, photoId);
    setPendingPhotoId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onPhotosChange((prev) =>
      prev.map((p) => ({ ...p, is_cover: p.id === photoId })),
    );
  }

  function handleCaptionChange(photoId: string, value: string) {
    onPhotosChange((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, caption: value } : p)),
    );
  }

  async function handleCaptionBlur(photoId: string, value: string) {
    const result = await updatePhotoCaption(chapterId, photoId, value);
    if ("error" in result) {
      setError(result.error);
    }
  }

  async function handleMove(photoId: string, direction: "up" | "down") {
    setError(null);
    setPendingPhotoId(photoId);
    const result = await movePhoto(chapterId, photoId, direction);
    setPendingPhotoId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onPhotosChange((prev) => {
      const index = prev.findIndex((p) => p.id === photoId);
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || swapIndex < 0 || swapIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  }

  return (
    <section className="mt-8 flex flex-col gap-4 text-left">
      <h2 className="text-lg font-bold text-gold">Photos</h2>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-md border-2 border-dashed px-4 py-8 text-center text-sm ${
          isDragActive ? "border-gold bg-white/5" : "border-brandgrey/30"
        }`}
      >
        <input {...getInputProps()} />
        <p>
          {isUploading
            ? "Uploading…"
            : "Drag photos here, or click to choose files"}
        </p>
      </div>

      {error && <p className="text-sm text-red">{error}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative overflow-hidden rounded-md border border-brandgrey/20 bg-offwhite"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.public_url}
                alt={photo.original_filename ?? ""}
                className="h-32 w-full object-cover"
              />
              {photo.is_cover && (
                <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-xs font-semibold text-navy">
                  Cover
                </span>
              )}

              <input
                value={photo.caption ?? ""}
                onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                onBlur={(e) => handleCaptionBlur(photo.id, e.target.value)}
                placeholder="Caption"
                className="w-full border-t border-brandgrey/20 bg-offwhite px-2 py-1 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-gold"
              />

              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(photo.id, "up")}
                    disabled={index === 0 || pendingPhotoId === photo.id}
                    className="text-xs font-semibold text-navy disabled:opacity-30"
                    title="Move earlier"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(photo.id, "down")}
                    disabled={
                      index === photos.length - 1 || pendingPhotoId === photo.id
                    }
                    className="text-xs font-semibold text-navy disabled:opacity-30"
                    title="Move later"
                  >
                    →
                  </button>
                </div>
                {!photo.is_cover && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(photo.id)}
                    disabled={pendingPhotoId === photo.id}
                    className="text-xs font-semibold text-navy hover:text-gold disabled:opacity-50"
                  >
                    Set cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  disabled={pendingPhotoId === photo.id}
                  className="text-xs font-semibold text-red disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
