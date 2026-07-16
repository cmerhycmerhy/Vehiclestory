"use client";

import { useState } from "react";
import EntryForm from "./EntryForm";
import PhotoUpload from "./PhotoUpload";

type AlbumEntry = Parameters<typeof EntryForm>[0]["entry"];
type Photo = Parameters<typeof PhotoUpload>[0]["photos"][number];

export default function ChapterEditor({
  chapterId,
  entry,
  initialPhotos,
}: {
  chapterId: string;
  entry: AlbumEntry;
  initialPhotos: Photo[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);

  return (
    <>
      <EntryForm chapterId={chapterId} entry={entry} photoCount={photos.length} />
      <PhotoUpload
        chapterId={chapterId}
        photos={photos}
        onPhotosChange={setPhotos}
      />
    </>
  );
}
