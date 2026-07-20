import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PhotoGallery from "./PhotoGallery";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function vehicleName(vehicle: { year: number | null; make: string | null; model: string | null }) {
  return `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vin: string }>;
}): Promise<Metadata> {
  const { vin } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, vin, year, make, model")
    .eq("vin", vin.toUpperCase())
    .maybeSingle();

  if (!vehicle) {
    return { title: "Vehicle not found | VehicleStory" };
  }

  const { data: entry } = await supabase
    .from("album_entries")
    .select("chapter_id, nickname, origin_story")
    .eq("vehicle_id", vehicle.id)
    .eq("is_published", true)
    .order("published_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const name = vehicleName(vehicle);
  const title = `${name}${entry?.nickname ? ` — ${entry.nickname}` : ""} | VehicleStory`;
  const description =
    entry?.origin_story?.slice(0, 160) || `${name} on VehicleStory.`;
  const url = `${SITE_URL}/album/${vehicle.vin}`;

  let imageUrl: string | null = null;
  if (entry?.chapter_id) {
    const { data: cover } = await supabase
      .from("album_photos")
      .select("public_url")
      .eq("chapter_id", entry.chapter_id)
      .eq("is_cover", true)
      .maybeSingle();
    imageUrl = cover?.public_url ?? null;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "VehicleStory",
      type: "website",
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function PublicAlbumPage({
  params,
}: {
  params: Promise<{ vin: string }>;
}) {
  const { vin } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, vin, year, make, model, trim, body_style, engine, country_of_origin")
    .eq("vin", vin.toUpperCase())
    .maybeSingle();

  if (!vehicle) {
    notFound();
  }

  const { data: entries } = await supabase
    .from("album_entries")
    .select(
      "id, chapter_id, nickname, origin_story, what_i_love, best_memory, events_attended, no_events, modifications, condition_description, location_city, location_state, anything_else, published_at",
    )
    .eq("vehicle_id", vehicle.id)
    .eq("is_published", true)
    .order("published_at", { ascending: true });

  if (!entries || entries.length === 0) {
    notFound();
  }

  const chapterIds = entries.map((e) => e.chapter_id);
  const { data: photos } = await supabase
    .from("album_photos")
    .select("id, chapter_id, public_url, is_cover, caption")
    .in("chapter_id", chapterIds)
    .order("display_order", { ascending: true });

  const photosByChapter = new Map<string, typeof photos>();
  for (const photo of photos ?? []) {
    const list = photosByChapter.get(photo.chapter_id) ?? [];
    list.push(photo);
    photosByChapter.set(photo.chapter_id, list);
  }

  const name = vehicleName(vehicle);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name,
    vehicleModelDate: vehicle.year ? String(vehicle.year) : undefined,
    brand: vehicle.make ? { "@type": "Brand", name: vehicle.make } : undefined,
    model: vehicle.model ?? undefined,
    description: entries[0]?.origin_story?.slice(0, 200) ?? undefined,
  };

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">{name}</h1>
        {vehicle.trim && <p className="mt-1 text-brandgrey">{vehicle.trim}</p>}
        <p className="mt-1 text-sm text-brandgrey">VIN {vehicle.vin}</p>

        <div className="mt-10 flex flex-col gap-10">
          {entries.map((entry) => {
            const entryPhotos = photosByChapter.get(entry.chapter_id) ?? [];

            return (
              <article
                key={entry.id}
                className="rounded-lg border border-brandgrey/20 bg-offwhite p-6 text-navy"
              >
                <PhotoGallery photos={entryPhotos} />

                {entry.nickname && (
                  <h2 className="text-2xl font-bold">{entry.nickname}</h2>
                )}

                {entry.origin_story && (
                  <p className="mt-3 whitespace-pre-wrap">{entry.origin_story}</p>
                )}

                {entry.what_i_love && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gold">Favorite Feature</h3>
                    <p className="mt-1 whitespace-pre-wrap">{entry.what_i_love}</p>
                  </div>
                )}

                {entry.best_memory && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gold">Best memory</h3>
                    <p className="mt-1 whitespace-pre-wrap">{entry.best_memory}</p>
                  </div>
                )}

                {!entry.no_events && entry.events_attended && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gold">Events attended</h3>
                    <p className="mt-1 whitespace-pre-wrap">
                      {entry.events_attended}
                    </p>
                  </div>
                )}

                {entry.modifications && entry.modifications.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gold">Modifications</h3>
                    <ul className="mt-1 list-inside list-disc">
                      {entry.modifications.map((mod: string) => (
                        <li key={mod}>{mod}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(entry.location_city || entry.location_state) && (
                  <p className="mt-4 text-sm text-brandgrey">
                    {[entry.location_city, entry.location_state]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-16 rounded-lg border border-gold/40 bg-offwhite px-6 py-10 text-center text-navy">
          <p className="text-2xl font-bold">Every car has a story.</p>
          <p className="mt-1 text-lg text-brandgrey">Does yours?</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-md bg-red px-6 py-2.5 font-semibold text-white transition hover:opacity-90"
          >
            Start your car&apos;s album
          </Link>
        </div>
      </div>
    </main>
  );
}
