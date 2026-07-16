"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useDropzone } from "react-dropzone";
import { createChapter } from "./actions";
import { RELATIONSHIP_TYPES, PROOF_DOCUMENT_TYPES } from "@/lib/constants";

export default function ChapterForm({ vin }: { vin: string }) {
  const [relationshipType, setRelationshipType] = useState("current_owner");
  const [isCurrent, setIsCurrent] = useState(true);
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [connectionDescription, setConnectionDescription] = useState("");
  const [proofDocumentType, setProofDocumentType] = useState("title");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [], "application/pdf": [] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    onDrop: (accepted) => {
      if (accepted[0]) setProofFile(accepted[0]);
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("vin", vin);
    formData.set("relationship_type", relationshipType);
    formData.set("is_current", isCurrent ? "true" : "false");
    formData.set("started_at", startedAt);
    formData.set("ended_at", isCurrent ? "" : endedAt);
    formData.set("connection_description", connectionDescription);
    if (proofFile) {
      formData.set("proof_document_type", proofDocumentType);
      formData.set("proof_document", proofFile);
    }

    startTransition(async () => {
      const result = await createChapter(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5 text-left">
      <div>
        <label className="block text-sm font-medium">
          Your relationship to this vehicle
        </label>
        <select
          value={relationshipType}
          onChange={(e) => setRelationshipType(e.target.value)}
          className="mt-1 w-full rounded-md border border-brandgrey/30 bg-offwhite px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold"
        >
          {RELATIONSHIP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_current"
          type="checkbox"
          checked={isCurrent}
          onChange={(e) => setIsCurrent(e.target.checked)}
          className="h-4 w-4 rounded border-brandgrey/30"
        />
        <label htmlFor="is_current" className="text-sm">
          I currently own this vehicle
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Started</label>
          <input
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="mt-1 w-full rounded-md border border-brandgrey/30 bg-offwhite px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        {!isCurrent && (
          <div>
            <label className="block text-sm font-medium">Ended</label>
            <input
              type="date"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              className="mt-1 w-full rounded-md border border-brandgrey/30 bg-offwhite px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">
          How are you connected to this vehicle?
        </label>
        <textarea
          value={connectionDescription}
          onChange={(e) => setConnectionDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-brandgrey/30 bg-offwhite px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          Proof of connection (optional)
        </label>
        <p className="text-xs text-brandgrey">
          Title, registration, bill of sale, or similar. Kept private — never
          shown publicly.
        </p>

        {proofFile ? (
          <div className="mt-2 flex items-center justify-between rounded-md border border-brandgrey/30 bg-offwhite px-4 py-2.5 text-navy">
            <span className="truncate text-sm">{proofFile.name}</span>
            <button
              type="button"
              onClick={() => setProofFile(null)}
              className="text-sm font-semibold text-red"
            >
              Remove
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`mt-2 cursor-pointer rounded-md border-2 border-dashed px-4 py-6 text-center text-sm ${
              isDragActive ? "border-gold bg-white/5" : "border-brandgrey/30"
            }`}
          >
            <input {...getInputProps()} />
            <p>Drag a file here, or click to choose one</p>
          </div>
        )}

        {proofFile && (
          <select
            value={proofDocumentType}
            onChange={(e) => setProofDocumentType(e.target.value)}
            className="mt-2 w-full rounded-md border border-brandgrey/30 bg-offwhite px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold"
          >
            {PROOF_DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="text-sm text-red">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-md bg-red px-6 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Start this vehicle's story"}
      </button>
    </form>
  );
}
