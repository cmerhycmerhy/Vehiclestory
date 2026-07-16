import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { decodeVIN } from "@/lib/nhtsa";
import ChapterForm from "./ChapterForm";

export default async function NewChapterPage({
  searchParams,
}: {
  searchParams: Promise<{ vin?: string }>;
}) {
  const { vin: rawVin } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = rawVin
      ? `/album/new?vin=${encodeURIComponent(rawVin)}`
      : "/album/new";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (!rawVin) {
    redirect("/");
  }

  const decoded = await decodeVIN(rawVin);
  if (!decoded.isValid) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight">
          Start {decoded.year} {decoded.make} {decoded.model}&apos;s story
        </h1>
        <p className="mt-2 text-brandgrey">VIN {decoded.vin}</p>

        <ChapterForm vin={decoded.vin} />
      </div>
    </main>
  );
}
