import Link from "next/link";
import { signup } from "@/app/auth/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold tracking-tight">
          Sign up
        </h1>
        <p className="mt-2 text-center text-brandgrey">
          Create an account to start your vehicle&apos;s story.
        </p>

        <form action={signup} className="mt-8 flex flex-col gap-4">
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
          {message && <p className="text-sm text-gold">{message}</p>}

          <button
            type="submit"
            className="mt-2 rounded-md bg-red px-6 py-2.5 font-semibold text-white transition hover:opacity-90"
          >
            Sign up
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brandgrey">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-gold">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
