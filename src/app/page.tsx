import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import VinSearch from "@/components/VinSearch";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      <Image
        src="/hero-porsche.png"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-navy/80" />

      <div className="relative z-10">
        <VinSearch isLoggedIn={!!user} />
      </div>
    </main>
  );
}
