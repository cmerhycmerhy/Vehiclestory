"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RELATIONSHIP_TYPE_VALUES } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";

async function getOwnedChapter(chapterId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: chapter } = await supabase
    .from("ownership_chapters")
    .select("id, user_id, vehicle_id")
    .eq("id", chapterId)
    .maybeSingle();

  if (!chapter || chapter.user_id !== user.id) {
    return { supabase, user, chapter: null };
  }

  return { supabase, user, chapter };
}

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function int(formData: FormData, key: string): number | null {
  const value = str(formData, key);
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function saveEntry(
  chapterId: string,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const { supabase, chapter } = await getOwnedChapter(chapterId);
  if (!chapter) {
    return { error: "You don't have access to this chapter." };
  }

  const mileageUnknown = formData.get("mileage_unknown") === "true";
  const noEvents = formData.get("no_events") === "true";

  const nickname = str(formData, "nickname");
  const originStory = str(formData, "origin_story");
  const locationCity = str(formData, "location_city");

  const modificationsRaw = str(formData, "modifications");
  const modifications = modificationsRaw
    ? modificationsRaw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  const fields = {
    relationship_label: str(formData, "relationship_label"),
    acquisition_month: int(formData, "acquisition_month"),
    acquisition_year: int(formData, "acquisition_year"),
    acquisition_mileage: mileageUnknown ? null : int(formData, "acquisition_mileage"),
    mileage_unknown: mileageUnknown,
    nickname,
    origin_story: originStory,
    what_i_love: str(formData, "what_i_love"),
    best_memory: str(formData, "best_memory"),
    events_attended: noEvents ? null : str(formData, "events_attended"),
    no_events: noEvents,
    modifications,
    condition_description: str(formData, "condition_description"),
    location_city: locationCity,
    location_state: str(formData, "location_state"),
    anything_else: str(formData, "anything_else"),
    section_a_complete: !!nickname,
    section_b_complete: !!originStory,
    section_c_complete: !!locationCity,
    draft_saved_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("album_entries")
    .select("id")
    .eq("chapter_id", chapterId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("album_entries").update(fields).eq("id", existing.id)
    : await supabase.from("album_entries").insert({
        ...fields,
        chapter_id: chapterId,
        vehicle_id: chapter.vehicle_id,
      });

  if (error) {
    return { error: "Could not save. Please try again." };
  }

  revalidatePath(`/chapters/${chapterId}`);
  return { success: true };
}

export async function updateChapterDetails(
  chapterId: string,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const { supabase, chapter } = await getOwnedChapter(chapterId);
  if (!chapter) {
    return { error: "You don't have access to this chapter." };
  }

  const relationshipType = formData.get("relationship_type") as string | null;
  if (!relationshipType || !RELATIONSHIP_TYPE_VALUES.has(relationshipType)) {
    return { error: "Please choose a valid relationship." };
  }

  const isCurrent = formData.get("is_current") === "true";
  const startedAt = str(formData, "started_at");
  const endedAt = isCurrent ? null : str(formData, "ended_at");

  const { error } = await supabase
    .from("ownership_chapters")
    .update({
      relationship_type: relationshipType,
      is_current: isCurrent,
      started_at: startedAt,
      ended_at: endedAt,
    })
    .eq("id", chapterId);

  if (error) {
    return { error: "Could not save. Please try again." };
  }

  revalidatePath(`/chapters/${chapterId}`);
  return { success: true };
}

export async function publishEntry(
  chapterId: string,
): Promise<{ error: string } | void> {
  const { supabase, chapter } = await getOwnedChapter(chapterId);
  if (!chapter) {
    return { error: "You don't have access to this chapter." };
  }

  const { data: entry } = await supabase
    .from("album_entries")
    .select("id, section_a_complete, section_b_complete, section_c_complete")
    .eq("chapter_id", chapterId)
    .maybeSingle();

  if (
    !entry ||
    !entry.section_a_complete ||
    !entry.section_b_complete ||
    !entry.section_c_complete
  ) {
    return { error: "Finish all three sections before publishing." };
  }

  const { count: photoCount } = await supabase
    .from("album_photos")
    .select("id", { count: "exact", head: true })
    .eq("chapter_id", chapterId);

  if (!photoCount) {
    return { error: "Add at least one photo before publishing." };
  }

  const { error } = await supabase
    .from("album_entries")
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq("id", entry.id);

  if (error) {
    return { error: "Could not publish. Please try again." };
  }

  revalidatePath(`/chapters/${chapterId}`);
  redirect(`/chapters/${chapterId}/published`);
}

export async function unpublishEntry(
  chapterId: string,
): Promise<{ error: string } | { success: true }> {
  const { supabase, chapter } = await getOwnedChapter(chapterId);
  if (!chapter) {
    return { error: "You don't have access to this chapter." };
  }

  const { error } = await supabase
    .from("album_entries")
    .update({ is_published: false, published_at: null })
    .eq("chapter_id", chapterId);

  if (error) {
    return { error: "Could not unpublish. Please try again." };
  }

  revalidatePath(`/chapters/${chapterId}`);
  return { success: true };
}

type UploadedPhoto = {
  id: string;
  public_url: string;
  is_cover: boolean;
  original_filename: string | null;
};

export async function uploadPhoto(
  chapterId: string,
  formData: FormData,
): Promise<{ error: string } | { success: true; photo: UploadedPhoto }> {
  const { supabase, user, chapter } = await getOwnedChapter(chapterId);
  if (!chapter) {
    return { error: "You don't have access to this chapter." };
  }

  const allowed = await checkRateLimit(`upload-photo:${user.id}`, 60, 3600);
  if (!allowed) {
    return { error: "Too many uploads recently. Please try again later." };
  }

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) {
    return { error: "No photo selected." };
  }

  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${chapterId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("vehicle-photos")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: "Could not upload photo. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("vehicle-photos").getPublicUrl(path);

  const { count: existingCount } = await supabase
    .from("album_photos")
    .select("id", { count: "exact", head: true })
    .eq("chapter_id", chapterId);

  const { data: inserted, error: insertError } = await supabase
    .from("album_photos")
    .insert({
      chapter_id: chapterId,
      vehicle_id: chapter.vehicle_id,
      storage_path: path,
      public_url: publicUrl,
      is_cover: (existingCount ?? 0) === 0,
      display_order: existingCount ?? 0,
      file_size_bytes: file.size,
      original_filename: file.name,
    })
    .select("id, public_url, is_cover, original_filename")
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from("vehicle-photos").remove([path]);
    return { error: "Could not save photo. Please try again." };
  }

  revalidatePath(`/chapters/${chapterId}`);
  return { success: true, photo: inserted };
}

export async function deletePhoto(
  chapterId: string,
  photoId: string,
): Promise<{ error: string } | { success: true }> {
  const { supabase, chapter } = await getOwnedChapter(chapterId);
  if (!chapter) {
    return { error: "You don't have access to this chapter." };
  }

  const { data: photo } = await supabase
    .from("album_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("chapter_id", chapterId)
    .maybeSingle();

  if (!photo) {
    return { error: "Photo not found." };
  }

  await supabase.storage.from("vehicle-photos").remove([photo.storage_path]);

  const { error } = await supabase
    .from("album_photos")
    .delete()
    .eq("id", photoId);

  if (error) {
    return { error: "Could not delete photo. Please try again." };
  }

  revalidatePath(`/chapters/${chapterId}`);
  return { success: true };
}

export async function updatePhotoCaption(
  chapterId: string,
  photoId: string,
  caption: string,
): Promise<{ error: string } | { success: true }> {
  const { supabase, chapter } = await getOwnedChapter(chapterId);
  if (!chapter) {
    return { error: "You don't have access to this chapter." };
  }

  const { error } = await supabase
    .from("album_photos")
    .update({ caption: caption.trim() || null })
    .eq("id", photoId)
    .eq("chapter_id", chapterId);

  if (error) {
    return { error: "Could not save caption. Please try again." };
  }

  revalidatePath(`/chapters/${chapterId}`);
  return { success: true };
}

export async function movePhoto(
  chapterId: string,
  photoId: string,
  direction: "up" | "down",
): Promise<{ error: string } | { success: true }> {
  const { supabase, chapter } = await getOwnedChapter(chapterId);
  if (!chapter) {
    return { error: "You don't have access to this chapter." };
  }

  const { data: photos } = await supabase
    .from("album_photos")
    .select("id, display_order")
    .eq("chapter_id", chapterId)
    .order("display_order", { ascending: true });

  if (!photos) {
    return { error: "Could not reorder. Please try again." };
  }

  const index = photos.findIndex((p) => p.id === photoId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= photos.length) {
    return { error: "Can't move further." };
  }

  const a = photos[index];
  const b = photos[swapIndex];

  const { error: errorA } = await supabase
    .from("album_photos")
    .update({ display_order: b.display_order })
    .eq("id", a.id);
  const { error: errorB } = await supabase
    .from("album_photos")
    .update({ display_order: a.display_order })
    .eq("id", b.id);

  if (errorA || errorB) {
    return { error: "Could not reorder. Please try again." };
  }

  revalidatePath(`/chapters/${chapterId}`);
  return { success: true };
}

export async function setCoverPhoto(
  chapterId: string,
  photoId: string,
): Promise<{ error: string } | { success: true }> {
  const { supabase, chapter } = await getOwnedChapter(chapterId);
  if (!chapter) {
    return { error: "You don't have access to this chapter." };
  }

  await supabase
    .from("album_photos")
    .update({ is_cover: false })
    .eq("chapter_id", chapterId);

  const { error } = await supabase
    .from("album_photos")
    .update({ is_cover: true })
    .eq("id", photoId);

  if (error) {
    return { error: "Could not set cover photo. Please try again." };
  }

  revalidatePath(`/chapters/${chapterId}`);
  return { success: true };
}
