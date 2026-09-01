"use client";

import Link from "next/link";
import ShareButtons from "@/components/ShareButtons";

export default function ShareScreen({
  vehicleName,
  nickname,
  coverPhotoUrl,
  albumUrl,
}: {
  vehicleName: string;
  nickname: string | null;
  coverPhotoUrl: string | null;
  albumUrl: string;
}) {
  return (
    <div className="w-full max-w-xl text-center">
      {coverPhotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverPhotoUrl}
          alt=""
          className="mx-auto h-64 w-full rounded-lg object-cover"
        />
      )}

      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        Your car&apos;s story is live.
      </h1>
      <p className="mt-2 text-brandgrey">{vehicleName}</p>

      <div className="mt-6">
        <ShareButtons
          vehicleName={vehicleName}
          nickname={nickname}
          coverPhotoUrl={coverPhotoUrl}
          albumUrl={albumUrl}
        />
      </div>

      <Link
        href={albumUrl.replace(/^https?:\/\/[^/]+/, "")}
        className="mt-8 inline-block rounded-md bg-red px-6 py-2.5 font-semibold text-white transition hover:opacity-90"
      >
        View your album
      </Link>
    </div>
  );
}
