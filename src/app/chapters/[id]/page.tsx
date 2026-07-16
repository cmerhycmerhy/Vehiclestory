import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChapterEditor from "./ChapterEditor";
import ChapterDetailsForm from "./ChapterDetailsForm";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/chapters/${id}`)}`);
  }

  const { data: chapter } = await supabase
    .from("ownership_chapters")
    .select(
      "id, user_id, relationship_type, is_current, started_at, ended_at, proof_document_path, vehicles(vin, year, make, model)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!chapter) {
    notFound();
  }

  if (chapter.user_id !== user.id) {
    notFound();
  }

  const vehicle = Array.isArray(chapter.vehicles)
    ? chapter.vehicles[0]
    : chapter.vehicles;

  const { data: entry } = await supabase
    .from("album_entries")
    .select(
      "relationship_label, acquisition_month, acquisition_year, acquisition_mileage, mileage_unknown, nickname, origin_story, what_i_love, best_memory, events_attended, no_events, modifications, condition_description, location_city, location_state, anything_else, is_published",
    )
    .eq("chapter_id", id)
    .maybeSingle();

  const { data: photos } = await supabase
    .from("album_photos")
    .select("id, public_url, is_cover, original_filename, caption")
    .eq("chapter_id", id)
    .order("display_order", { ascending: true });

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight">
          {vehicle?.year} {vehicle?.make} {vehicle?.model}
        </h1>
        <p className="mt-1 text-brandgrey">VIN {vehicle?.vin}</p>

        <ChapterDetailsForm
          chapterId={id}
          initial={{
            relationship_type: chapter.relationship_type,
            is_current: chapter.is_current,
            started_at: chapter.started_at,
            ended_at: chapter.ended_at,
          }}
        />

        <ChapterEditor
          chapterId={id}
          entry={entry ?? null}
          initialPhotos={photos ?? []}
        />
      </div>
    </main>
  );
}
