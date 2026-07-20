import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RELATIONSHIP_LABELS } from "@/lib/constants";

export default async function GaragePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fgarage");
  }

  const { data: chapters } = await supabase
    .from("ownership_chapters")
    .select(
      "id, relationship_type, vehicles(vin, year, make, model), album_entries(nickname, is_published)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">My garage</h1>

        {!chapters || chapters.length === 0 ? (
          <p className="mt-4 text-brandgrey">
            You haven&apos;t claimed any vehicles yet.{" "}
            <Link href="/" className="font-semibold text-gold">
              Look one up by VIN
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {chapters.map((chapter) => {
              const vehicle = Array.isArray(chapter.vehicles)
                ? chapter.vehicles[0]
                : chapter.vehicles;
              const entry = Array.isArray(chapter.album_entries)
                ? chapter.album_entries[0]
                : chapter.album_entries;

              return (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-brandgrey/20 bg-offwhite px-5 py-4 text-navy"
                >
                  <Link
                    href={`/chapters/${chapter.id}`}
                    className="min-w-0 flex-1 transition hover:opacity-80"
                  >
                    <p className="truncate font-bold">
                      {entry?.nickname ? `${entry.nickname} — ` : ""}
                      {vehicle?.year} {vehicle?.make} {vehicle?.model}
                    </p>
                    <p className="truncate text-sm text-brandgrey">
                      VIN {vehicle?.vin} ·{" "}
                      {RELATIONSHIP_LABELS[chapter.relationship_type] ??
                        chapter.relationship_type}
                    </p>
                  </Link>

                  <div className="flex shrink-0 items-center gap-3">
                    {entry?.is_published && (
                      <Link
                        href={`/chapters/${chapter.id}/published`}
                        className="rounded-md border border-brandgrey/30 px-3 py-1.5 text-xs font-semibold transition hover:bg-navy/5"
                      >
                        Share
                      </Link>
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        entry?.is_published ? "text-gold" : "text-brandgrey"
                      }`}
                    >
                      {entry?.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
