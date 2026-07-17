import { NextResponse } from "next/server";
import { decodeVIN } from "@/lib/nhtsa";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vin: string }> },
) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`vin-lookup:${ip}`, 20, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many lookups. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const { vin } = await params;

  const decoded = await decodeVIN(vin);
  if (!decoded.isValid) {
    return NextResponse.json({ error: decoded.errorMessage }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, vin")
    .eq("vin", decoded.vin)
    .maybeSingle();

  let albumExists = false;
  if (vehicle) {
    const { data: publishedEntry } = await supabase
      .from("album_entries")
      .select("id")
      .eq("vehicle_id", vehicle.id)
      .eq("is_published", true)
      .limit(1)
      .maybeSingle();

    albumExists = !!publishedEntry;
  }

  return NextResponse.json({
    vehicle: decoded,
    albumExists,
    albumUrl: albumExists ? `/album/${decoded.vin}` : null,
  });
}
