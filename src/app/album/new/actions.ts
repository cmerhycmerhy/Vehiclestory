"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeVIN } from "@/lib/nhtsa";
import { RELATIONSHIP_TYPE_VALUES } from "@/lib/constants";

export async function createChapter(
  formData: FormData,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const vin = (formData.get("vin") as string | null)?.trim().toUpperCase();
  const relationshipType = formData.get("relationship_type") as string | null;
  const isCurrent = formData.get("is_current") === "true";
  const startedAt = (formData.get("started_at") as string | null) || null;
  const endedAt = isCurrent
    ? null
    : (formData.get("ended_at") as string | null) || null;
  const connectionDescription =
    (formData.get("connection_description") as string | null) || null;
  const proofDocumentType = formData.get(
    "proof_document_type",
  ) as string | null;
  const proofFile = formData.get("proof_document") as File | null;

  if (
    !vin ||
    !relationshipType ||
    !RELATIONSHIP_TYPE_VALUES.has(relationshipType)
  ) {
    return { error: "Please fill in the required fields." };
  }

  const admin = createAdminClient();

  let vehicle: { id: string } | null = null;
  const { data: existingVehicle } = await admin
    .from("vehicles")
    .select("id")
    .eq("vin", vin)
    .maybeSingle();

  if (existingVehicle) {
    vehicle = existingVehicle;
  } else {
    const decoded = await decodeVIN(vin);
    if (!decoded.isValid) {
      return { error: decoded.errorMessage ?? "Could not verify this VIN." };
    }

    const { data: inserted, error: insertError } = await admin
      .from("vehicles")
      .insert({
        vin: decoded.vin,
        year: decoded.year,
        make: decoded.make,
        model: decoded.model,
        trim: decoded.trim,
        body_style: decoded.bodyStyle,
        engine: decoded.engine,
        country_of_origin: decoded.countryOfOrigin,
        nhtsa_data: decoded.rawData,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return { error: "Could not save this vehicle. Please try again." };
    }
    vehicle = inserted;
  }

  let proofDocumentPath: string | null = null;

  if (proofFile && proofFile.size > 0) {
    const extension = proofFile.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("proof-documents")
      .upload(path, proofFile, { contentType: proofFile.type });

    if (uploadError) {
      return {
        error: "Could not upload your proof document. Please try again.",
      };
    }

    proofDocumentPath = path;
  }

  const { data: chapter, error: chapterError } = await supabase
    .from("ownership_chapters")
    .insert({
      vehicle_id: vehicle.id,
      user_id: user.id,
      relationship_type: relationshipType,
      started_at: startedAt,
      ended_at: endedAt,
      is_current: isCurrent,
      proof_document_path: proofDocumentPath,
      proof_document_type: proofDocumentPath ? proofDocumentType : null,
      connection_description: connectionDescription,
    })
    .select("id")
    .single();

  if (chapterError || !chapter) {
    return { error: "Could not create this chapter. Please try again." };
  }

  redirect(`/chapters/${chapter.id}`);
}
