import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex flex-wrap items-center justify-between gap-y-2 border-b border-brandgrey/20 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <Link href="/" className="whitespace-nowrap text-lg font-bold tracking-tight">
          VehicleStory
        </Link>
        <Link
          href="/browse"
          className="whitespace-nowrap text-sm font-semibold transition hover:text-gold"
        >
          Browse
        </Link>
      </div>

      {user ? (
        <div className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
          <Link
            href="/garage"
            className="whitespace-nowrap font-semibold transition hover:text-gold"
          >
            My garage
          </Link>
          <span className="max-w-[160px] truncate text-brandgrey sm:max-w-none">
            {user.email}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="whitespace-nowrap rounded-md border border-brandgrey/30 px-3 py-1.5 font-semibold transition hover:bg-white/5"
            >
              Log out
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/login" className="whitespace-nowrap font-semibold transition hover:text-gold">
            Log in
          </Link>
          <Link
            href="/signup"
            className="whitespace-nowrap rounded-md bg-red px-4 py-1.5 font-semibold text-white transition hover:opacity-90"
          >
            Sign up
          </Link>
        </div>
      )}
    </header>
  );
}
