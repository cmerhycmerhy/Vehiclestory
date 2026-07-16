import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b border-brandgrey/20 px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          VehicleStory
        </Link>
        <Link
          href="/browse"
          className="text-sm font-semibold transition hover:text-gold"
        >
          Browse
        </Link>
      </div>

      {user ? (
        <div className="flex items-center gap-4 text-sm">
          <Link href="/garage" className="font-semibold transition hover:text-gold">
            My garage
          </Link>
          <span className="text-brandgrey">{user.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-brandgrey/30 px-3 py-1.5 font-semibold transition hover:bg-white/5"
            >
              Log out
            </button>
          </form>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="font-semibold transition hover:text-gold">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-red px-4 py-1.5 font-semibold text-white transition hover:opacity-90"
          >
            Sign up
          </Link>
        </div>
      )}
    </header>
  );
}
