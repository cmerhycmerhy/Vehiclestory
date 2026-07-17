import { createClient } from "@/lib/supabase/server";

// Checks a fixed-window rate limit backed by Postgres (see
// supabase/rate-limits.sql). Fails open on infrastructure errors — a
// rate-limit outage shouldn't take down the underlying feature, since
// this is abuse deterrence, not the primary security boundary.
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Rate limit check failed:", error);
    return true;
  }

  return data === true;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}
