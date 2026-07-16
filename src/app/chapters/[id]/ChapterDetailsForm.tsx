"use client";

import { useState, useTransition } from "react";
import { updateChapterDetails } from "./actions";
import { RELATIONSHIP_TYPES, RELATIONSHIP_LABELS } from "@/lib/constants";

const inputClass =
  "mt-1 w-full rounded-md border border-brandgrey/30 bg-offwhite px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function ChapterDetailsForm({
  chapterId,
  initial,
}: {
  chapterId: string;
  initial: {
    relationship_type: string;
    is_current: boolean;
    started_at: string | null;
    ended_at: string | null;
  };
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [relationshipType, setRelationshipType] = useState(
    initial.relationship_type,
  );
  const [isCurrent, setIsCurrent] = useState(initial.is_current);
  const [startedAt, setStartedAt] = useState(initial.started_at ?? "");
  const [endedAt, setEndedAt] = useState(initial.ended_at ?? "");
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    const formData = new FormData();
    formData.set("relationship_type", relationshipType);
    formData.set("is_current", isCurrent ? "true" : "false");
    formData.set("started_at", startedAt);
    formData.set("ended_at", isCurrent ? "" : endedAt);

    startTransition(async () => {
      const result = await updateChapterDetails(chapterId, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved({
        relationship_type: relationshipType,
        is_current: isCurrent,
        started_at: startedAt || null,
        ended_at: isCurrent ? null : endedAt || null,
      });
      setIsEditing(false);
    });
  }

  function handleCancel() {
    setRelationshipType(saved.relationship_type);
    setIsCurrent(saved.is_current);
    setStartedAt(saved.started_at ?? "");
    setEndedAt(saved.ended_at ?? "");
    setError(null);
    setIsEditing(false);
  }

  if (!isEditing) {
    const dateRange =
      saved.started_at || saved.ended_at
        ? ` · ${saved.started_at ?? "?"} to ${saved.is_current ? "present" : (saved.ended_at ?? "?")}`
        : "";

    return (
      <div className="mt-1 flex items-center gap-2 text-sm text-brandgrey">
        <span>
          {RELATIONSHIP_LABELS[saved.relationship_type] ??
            saved.relationship_type}
          {dateRange}
        </span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="font-semibold text-gold"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-3 rounded-md border border-brandgrey/20 bg-offwhite p-4 text-navy">
      <div>
        <label className="block text-sm font-medium">Relationship</label>
        <select
          value={relationshipType}
          onChange={(e) => setRelationshipType(e.target.value)}
          className={inputClass}
        >
          {RELATIONSHIP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isCurrent}
          onChange={(e) => setIsCurrent(e.target.checked)}
          className="h-4 w-4 rounded border-brandgrey/30"
        />
        I currently own this vehicle
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Started</label>
          <input
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className={inputClass}
          />
        </div>
        {!isCurrent && (
          <div>
            <label className="block text-sm font-medium">Ended</label>
            <input
              type="date"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="rounded-md border border-brandgrey/30 px-4 py-2 text-sm font-semibold text-navy"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
