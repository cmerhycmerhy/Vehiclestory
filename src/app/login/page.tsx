import Link from "next/link";
import { login } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold tracking-tight">
          Log in
        </h1>
        <p className="mt-2 text-center text-brandgrey">
          Welcome back to VehicleStory.
        </p>

        <form action={login} className="mt-8 flex flex-col gap-4">
          {next && <input type="hidden" name="next" value={next} />}
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-brandgrey/30 bg-offwhite px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-brandgrey/30 bg-offwhite px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          {error && <p className="text-sm text-red">{error}</p>}

          <button
            type="submit"
            className="mt-2 rounded-md bg-red px-6 py-2.5 font-semibold text-white transition hover:opacity-90"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brandgrey">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-gold">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
