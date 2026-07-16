import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShareScreen from "./ShareScreen";

export default async function PublishedPage({
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
    redirect(
      `/login?next=${encodeURIComponent(`/chapters/${id}/published`)}`,
    );
  }

  const { data: chapter } = await supabase
    .from("ownership_chapters")
    .select("id, user_id, vehicles(vin, year, make, model)")
    .eq("id", id)
    .maybeSingle();

  if (!chapter || chapter.user_id !== user.id) {
    notFound();
  }

  const vehicle = Array.isArray(chapter.vehicles)
    ? chapter.vehicles[0]
    : chapter.vehicles;

  const { data: entry } = await supabase
    .from("album_entries")
    .select("nickname, is_published")
    .eq("chapter_id", id)
    .maybeSingle();

  if (!entry || !entry.is_published) {
    redirect(`/chapters/${id}`);
  }

  const { data: coverPhoto } = await supabase
    .from("album_photos")
    .select("public_url")
    .eq("chapter_id", id)
    .eq("is_cover", true)
    .maybeSingle();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const albumUrl = `${siteUrl}/album/${vehicle?.vin}`;
  const vehicleName = `${vehicle?.year ?? ""} ${vehicle?.make ?? ""} ${vehicle?.model ?? ""}`
    .replace(/\s+/g, " ")
    .trim();

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16">
      <ShareScreen
        vehicleName={vehicleName}
        nickname={entry.nickname}
        coverPhotoUrl={coverPhoto?.public_url ?? null}
        albumUrl={albumUrl}
      />
    </main>
  );
}
