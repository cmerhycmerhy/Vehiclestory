import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type PublishedEntry = {
  chapter_id: string;
  nickname: string | null;
  published_at: string | null;
};

export default async function BrowsePage() {
  const supabase = await createClient();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select(
      "vin, year, make, model, album_entries!inner(chapter_id, nickname, published_at)",
    )
    .eq("album_entries.is_published", true);

  const cards = (vehicles ?? []).map((vehicle) => {
    const entries: PublishedEntry[] = Array.isArray(vehicle.album_entries)
      ? vehicle.album_entries
      : [vehicle.album_entries];

    const [entry] = [...entries].sort((a, b) =>
      (b.published_at ?? "").localeCompare(a.published_at ?? ""),
    );

    return { vehicle, entry };
  });

  cards.sort((a, b) =>
    (b.entry.published_at ?? "").localeCompare(a.entry.published_at ?? ""),
  );

  const chapterIds = cards.map((c) => c.entry.chapter_id).filter(Boolean);

  const { data: coverPhotos } = chapterIds.length
    ? await supabase
        .from("album_photos")
        .select("chapter_id, public_url")
        .in("chapter_id", chapterIds)
        .eq("is_cover", true)
    : { data: [] };

  const coverByChapter = new Map(
    (coverPhotos ?? []).map((p) => [p.chapter_id, p.public_url]),
  );

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">Browse vehicles</h1>
        <p className="mt-2 text-brandgrey">
          {cards.length} published {cards.length === 1 ? "story" : "stories"}.
        </p>

        {cards.length === 0 ? (
          <p className="mt-8 text-brandgrey">No published stories yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {cards.map(({ vehicle, entry }) => (
              <Link
                key={vehicle.vin}
                href={`/album/${vehicle.vin}`}
                className="overflow-hidden rounded-lg border border-brandgrey/20 bg-offwhite text-navy transition hover:border-gold"
              >
                {coverByChapter.get(entry.chapter_id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverByChapter.get(entry.chapter_id)}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-brandgrey/20 text-sm text-brandgrey">
                    No photo
                  </div>
                )}
                <div className="p-3">
                  <p className="font-bold">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  {entry.nickname && (
                    <p className="text-sm text-brandgrey">{entry.nickname}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
