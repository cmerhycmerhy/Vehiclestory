"use client";

import { useState, useTransition, type FormEvent } from "react";
import { saveEntry, publishEntry, unpublishEntry } from "./actions";

type AlbumEntry = {
  relationship_label: string | null;
  acquisition_month: number | null;
  acquisition_year: number | null;
  acquisition_mileage: number | null;
  mileage_unknown: boolean;
  nickname: string | null;
  origin_story: string | null;
  what_i_love: string | null;
  best_memory: string | null;
  events_attended: string | null;
  no_events: boolean;
  modifications: string[] | null;
  condition_description: string | null;
  location_city: string | null;
  location_state: string | null;
  anything_else: string | null;
  is_published: boolean;
} | null;

const inputClass =
  "mt-1 w-full rounded-md border border-brandgrey/30 bg-offwhite px-4 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function EntryForm({
  chapterId,
  entry,
  photoCount,
}: {
  chapterId: string;
  entry: AlbumEntry;
  photoCount: number;
}) {
  const [nickname, setNickname] = useState(entry?.nickname ?? "");
  const [relationshipLabel, setRelationshipLabel] = useState(
    entry?.relationship_label ?? "",
  );
  const [acquisitionMonth, setAcquisitionMonth] = useState(
    entry?.acquisition_month?.toString() ?? "",
  );
  const [acquisitionYear, setAcquisitionYear] = useState(
    entry?.acquisition_year?.toString() ?? "",
  );
  const [mileageUnknown, setMileageUnknown] = useState(
    entry?.mileage_unknown ?? false,
  );
  const [acquisitionMileage, setAcquisitionMileage] = useState(
    entry?.acquisition_mileage?.toString() ?? "",
  );

  const [originStory, setOriginStory] = useState(entry?.origin_story ?? "");
  const [whatILove, setWhatILove] = useState(entry?.what_i_love ?? "");
  const [bestMemory, setBestMemory] = useState(entry?.best_memory ?? "");
  const [noEvents, setNoEvents] = useState(entry?.no_events ?? false);
  const [eventsAttended, setEventsAttended] = useState(
    entry?.events_attended ?? "",
  );
  const [modifications, setModifications] = useState(
    entry?.modifications?.join("\n") ?? "",
  );
  const [conditionDescription, setConditionDescription] = useState(
    entry?.condition_description ?? "",
  );

  const [locationCity, setLocationCity] = useState(
    entry?.location_city ?? "",
  );
  const [locationState, setLocationState] = useState(
    entry?.location_state ?? "",
  );
  const [anythingElse, setAnythingElse] = useState(entry?.anything_else ?? "");

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(entry?.is_published ?? false);
  const [isSaving, startSaveTransition] = useTransition();
  const [isPublishing, startPublishTransition] = useTransition();
  const [isUnpublishing, startUnpublishTransition] = useTransition();

  function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaveMessage(null);

    const formData = new FormData();
    formData.set("nickname", nickname);
    formData.set("relationship_label", relationshipLabel);
    formData.set("acquisition_month", acquisitionMonth);
    formData.set("acquisition_year", acquisitionYear);
    formData.set("mileage_unknown", mileageUnknown ? "true" : "false");
    formData.set("acquisition_mileage", acquisitionMileage);
    formData.set("origin_story", originStory);
    formData.set("what_i_love", whatILove);
    formData.set("best_memory", bestMemory);
    formData.set("no_events", noEvents ? "true" : "false");
    formData.set("events_attended", eventsAttended);
    formData.set("modifications", modifications);
    formData.set("condition_description", conditionDescription);
    formData.set("location_city", locationCity);
    formData.set("location_state", locationState);
    formData.set("anything_else", anythingElse);

    startSaveTransition(async () => {
      const result = await saveEntry(chapterId, formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSaveMessage("Draft saved.");
      }
    });
  }

  function handlePublish() {
    setError(null);
    setSaveMessage(null);
    startPublishTransition(async () => {
      const result = await publishEntry(chapterId);
      // On success, publishEntry redirects to the share screen — this
      // only resolves with a value on failure.
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  function handleUnpublish() {
    setError(null);
    setSaveMessage(null);
    startUnpublishTransition(async () => {
      const result = await unpublishEntry(chapterId);
      if ("error" in result) {
        setError(result.error);
      } else {
        setIsPublished(false);
      }
    });
  }

  const sectionAComplete = !!nickname;
  const sectionBComplete = !!originStory;
  const sectionCComplete = !!locationCity;
  const readyToPublish =
    sectionAComplete && sectionBComplete && sectionCComplete && photoCount > 0;

  return (
    <form onSubmit={handleSave} className="mt-8 flex flex-col gap-8 text-left">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gold">Section A — The basics</h2>

        <div>
          <label className="block text-sm font-medium">Nickname</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="What do you call this car?"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            A short label for this chapter
          </label>
          <input
            value={relationshipLabel}
            onChange={(e) => setRelationshipLabel(e.target.value)}
            placeholder="e.g. The daily driver"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">
              Month acquired
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={acquisitionMonth}
              onChange={(e) => setAcquisitionMonth(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Year acquired</label>
            <input
              type="number"
              value={acquisitionYear}
              onChange={(e) => setAcquisitionYear(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mileageUnknown}
              onChange={(e) => setMileageUnknown(e.target.checked)}
              className="h-4 w-4 rounded border-brandgrey/30"
            />
            I don&apos;t know the mileage at acquisition
          </label>
          {!mileageUnknown && (
            <input
              type="number"
              value={acquisitionMileage}
              onChange={(e) => setAcquisitionMileage(e.target.value)}
              placeholder="Mileage"
              className={`${inputClass} mt-2`}
            />
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gold">Section B — The story</h2>

        <div>
          <label className="block text-sm font-medium">Origin story</label>
          <textarea
            value={originStory}
            onChange={(e) => setOriginStory(e.target.value)}
            rows={4}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            What you love about it
          </label>
          <textarea
            value={whatILove}
            onChange={(e) => setWhatILove(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Best memory</label>
          <textarea
            value={bestMemory}
            onChange={(e) => setBestMemory(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={noEvents}
              onChange={(e) => setNoEvents(e.target.checked)}
              className="h-4 w-4 rounded border-brandgrey/30"
            />
            Haven&apos;t attended any events with this vehicle
          </label>
          {!noEvents && (
            <textarea
              value={eventsAttended}
              onChange={(e) => setEventsAttended(e.target.value)}
              rows={2}
              placeholder="Shows, meets, track days..."
              className={`${inputClass} mt-2`}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">
            Modifications (one per line)
          </label>
          <textarea
            value={modifications}
            onChange={(e) => setModifications(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Condition</label>
          <textarea
            value={conditionDescription}
            onChange={(e) => setConditionDescription(e.target.value)}
            rows={2}
            className={inputClass}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gold">
          Section C — Location & extras
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">City</label>
            <input
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">State</label>
            <input
              value={locationState}
              onChange={(e) => setLocationState(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Anything else</label>
          <textarea
            value={anythingElse}
            onChange={(e) => setAnythingElse(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>
      </section>

      {error && <p className="text-sm text-red">{error}</p>}
      {saveMessage && <p className="text-sm text-gold">{saveMessage}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-navy px-6 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save draft"}
        </button>

        {isPublished ? (
          <>
            <span className="text-sm font-semibold text-gold">Published</span>
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isUnpublishing}
              className="rounded-md border border-brandgrey/30 px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50"
            >
              {isUnpublishing ? "Unpublishing…" : "Unpublish"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || !readyToPublish}
            title={
              readyToPublish
                ? undefined
                : "Finish all three sections and add at least one photo first"
            }
            className="rounded-md bg-red px-6 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isPublishing ? "Publishing…" : "Publish"}
          </button>
        )}
      </div>
    </form>
  );
}
