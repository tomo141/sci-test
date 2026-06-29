import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminEmails } from "@/src/lib/env";
import { createServiceRoleClient } from "@/src/lib/supabase/server";

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export async function syncAdminRoleIfAllowed(
  userId: string,
  email: string | null | undefined
) {
  if (!isAdminEmail(email)) return false;

  const service = createServiceRoleClient();
  if (!service) return false;

  const profile = { id: userId, email: email!, role: "admin" as const };
  const { error: upsertError } = await service.from("profiles").upsert(profile);
  if (!upsertError) return true;

  const { error: updateError } = await service.from("profiles").update({ role: "admin" }).eq("id", userId);
  return !updateError;
}

async function resolveUserEmail(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined
) {
  if (email) return email.toLowerCase();

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  return profile?.email?.toLowerCase() ?? null;
}

export async function isAdminUser(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined
) {
  const resolvedEmail = await resolveUserEmail(supabase, userId, email);
  if (isAdminEmail(resolvedEmail)) {
    await syncAdminRoleIfAllowed(userId, resolvedEmail);
    return true;
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return profile?.role === "admin";
}
