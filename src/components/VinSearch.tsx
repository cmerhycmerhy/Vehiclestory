"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type VINDecodeResult = {
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  bodyStyle: string | null;
  engine: string | null;
  countryOfOrigin: string | null;
  rawData: Record<string, string>;
  isValid: boolean;
  errorMessage?: string;
};

type VinLookupResponse = {
  vehicle: VINDecodeResult;
  albumExists: boolean;
  albumUrl: string | null;
};

export default function VinSearch({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [vin, setVin] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [result, setResult] = useState<VinLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vin.trim()) return;

    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/vin/${encodeURIComponent(vin.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("success");
    } catch {
      setError("Unable to reach the server — please try again");
      setStatus("error");
    }
  }

  return (
    <div className="w-full max-w-xl text-center">
      <h1 className="text-4xl font-bold tracking-tight">VehicleStory</h1>
      <p className="mt-3 text-brandgrey">
        Every vehicle has a story. Find yours by VIN.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
        <input
          type="text"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          placeholder="Enter 17-character VIN"
          maxLength={17}
          className="flex-1 rounded-md border border-brandgrey/30 bg-offwhite px-4 py-3 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-red px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? "Looking up…" : "Look up"}
        </button>
      </form>

      {status === "error" && error && <p className="mt-4 text-red">{error}</p>}

      {status === "success" && result && (
        <div className="mt-8 rounded-lg border border-brandgrey/20 bg-offwhite p-6 text-left text-navy">
          <h2 className="text-2xl font-bold">
            {result.vehicle.year} {result.vehicle.make} {result.vehicle.model}
          </h2>
          {result.vehicle.trim && (
            <p className="text-brandgrey">{result.vehicle.trim}</p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="font-semibold">Body style</dt>
            <dd>{result.vehicle.bodyStyle ?? "—"}</dd>
            <dt className="font-semibold">Engine</dt>
            <dd>{result.vehicle.engine ?? "—"}</dd>
            <dt className="font-semibold">Origin</dt>
            <dd>{result.vehicle.countryOfOrigin ?? "—"}</dd>
            <dt className="font-semibold">VIN</dt>
            <dd className="font-mono">{result.vehicle.vin}</dd>
          </dl>

          <div className="mt-6">
            {result.albumExists && result.albumUrl ? (
              <a
                href={result.albumUrl}
                className="inline-block rounded-md bg-navy px-5 py-2.5 font-semibold text-white hover:opacity-90"
              >
                View this vehicle&apos;s album
              </a>
            ) : isLoggedIn ? (
              <Link
                href={`/album/new?vin=${encodeURIComponent(result.vehicle.vin)}`}
                className="inline-block rounded-md bg-navy px-5 py-2.5 font-semibold text-white hover:opacity-90"
              >
                Start this vehicle&apos;s story
              </Link>
            ) : (
              <p className="text-sm text-brandgrey">
                No public album yet for this vehicle.{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(`/album/new?vin=${result.vehicle.vin}`)}`}
                  className="font-semibold text-gold"
                >
                  Log in to start this vehicle&apos;s story.
                </Link>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
