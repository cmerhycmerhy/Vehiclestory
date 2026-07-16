import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Server-only; never import
// this from a "use client" file. Scoped to writes on public, non-user-owned
// data (e.g. caching NHTSA vehicle specs) where RLS intentionally has no
// authenticated write policy.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
