"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { syncAdminRoleIfAllowed } from "@/src/lib/admin/role";
import { getAdminEmails, getAppUrl } from "@/src/lib/env";
import { createServerSupabaseClient, createServiceRoleClient } from "@/src/lib/supabase/server";
import { verifyTurnstile } from "@/src/lib/security/turnstile";
import { enforceRateLimit, rateLimitPolicies } from "@/src/lib/security/rateLimit";
import { headers } from "next/headers";

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    passwordConfirm: z.string().min(8),
    nickname: z.string().trim().min(1).max(40),
    terms: z.string().optional(),
    marketingConsent: z.string().optional(),
    anonymousSessionId: z.string().optional()
  })
  .refine((value) => value.password === value.passwordConfirm, "passwords do not match")
  .refine((value) => value.terms === "on", "terms are required");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const resetSchema = z.object({
  email: z.string().email()
});

const profileSchema = z.object({
  nickname: z.string().trim().min(1).max(40),
  education: z.array(z.string().trim().max(40)).max(8),
  specialty: z.string().trim().max(80).optional()
});

async function enforceAuthRateLimit(scope: string) {
  const headerStore = await headers();
  const request = new Request("https://local/auth", {
    headers: {
      "x-forwarded-for": headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip") || "unknown"
    }
  });
  const limited = await enforceRateLimit(scope, "auth", rateLimitPolicies.auth, request);
  if (limited) redirect(`/${scope === "signup" ? "signup" : scope === "reset-password" ? "reset-password" : "login"}?error=too-many-requests`);
}

export async function signupAction(formData: FormData) {
  await enforceAuthRateLimit("signup");
  if (!(await verifyTurnstile(formData.get("cf-turnstile-response")))) redirect("/signup?error=turnstile");
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/signup?error=invalid");

  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/signup?demo=1");

  const { email, password, nickname, marketingConsent, anonymousSessionId } = parsed.data;
  const appUrl = getAppUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      data: {
        nickname: nickname || null,
        marketing_consent: marketingConsent === "on"
      }
    }
  });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

  const userId = data.user?.id;
  if (userId) {
    const role = getAdminEmails().includes(email.toLowerCase()) ? "admin" : "user";
    await supabase.from("profiles").upsert({ id: userId, email, nickname: nickname || null, role });
    await supabase.from("marketing_consents").upsert(
      {
        user_id: userId,
        consented: marketingConsent === "on",
        consented_at: marketingConsent === "on" ? new Date().toISOString() : null,
        training_unlocked_at: marketingConsent === "on" ? new Date().toISOString() : null
      },
      { onConflict: "user_id" }
    );
    if (anonymousSessionId) {
      const linkedSessions = await supabase.from("exam_sessions").select("id").eq("anonymous_session_id", anonymousSessionId);
      const linkedSessionIds = linkedSessions.data?.map((row) => row.id) || [];
      await supabase.from("exam_sessions").update({ user_id: userId }).eq("anonymous_session_id", anonymousSessionId);
      if (linkedSessionIds.length > 0) {
        await supabase.from("exam_answers").update({ user_id: userId }).is("user_id", null).in("session_id", linkedSessionIds);
      }
    }
  }

  redirect("/mypage");
}

export async function updateProfileAction(formData: FormData) {
  const parsed = profileSchema.safeParse({
    nickname: formData.get("nickname"),
    education: formData.getAll("education"),
    specialty: formData.get("specialty")
  });
  if (!parsed.success) redirect("/mypage?profile=invalid");

  const supabase = await createServerSupabaseClient();
  const user = await supabase?.auth.getUser();
  const userId = user?.data.user?.id;
  if (!supabase || !userId) redirect("/login");

  const { nickname, education, specialty } = parsed.data;
  const email = user.data.user?.email;
  if (!email) redirect("/login");

  const writeClient = createServiceRoleClient() || supabase;

  const { error: profileError } = await writeClient.from("profiles").upsert({
    id: userId,
    email,
    nickname,
    full_name: null,
    updated_at: new Date().toISOString()
  });
  if (profileError) redirect(`/mypage?profile=${encodeURIComponent(profileError.message)}`);

  const { error: educationError } = await writeClient.from("education_profiles").upsert({
    user_id: userId,
    highest_education: education.length ? education.join(",") : null,
    specialty: specialty || null
  });
  if (educationError) redirect(`/mypage?profile=${encodeURIComponent(educationError.message)}`);

  await supabase.auth.updateUser({ data: { nickname } });
  revalidatePath("/mypage");
  redirect("/mypage?profile=saved");
}

export async function loginAction(formData: FormData) {
  await enforceAuthRateLimit("login");
  if (!(await verifyTurnstile(formData.get("cf-turnstile-response")))) redirect("/login?error=turnstile");
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=invalid");

  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/login?demo=1");

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  const { data: authData } = await supabase.auth.getUser();
  const loggedInUser = authData.user;
  if (loggedInUser?.id) {
    await syncAdminRoleIfAllowed(loggedInUser.id, loggedInUser.email);
  }

  redirect("/mypage");
}

export async function resetPasswordAction(formData: FormData) {
  await enforceAuthRateLimit("reset-password");
  if (!(await verifyTurnstile(formData.get("cf-turnstile-response")))) redirect("/reset-password?error=turnstile");
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/reset-password?error=invalid");

  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/reset-password?demo=1");

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`
  });
  if (error) redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  redirect("/reset-password?sent=1");
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function updateMarketingConsentAction(formData: FormData) {
  if (formData.get("marketingConsent") !== "on") redirect("/mypage?marketing=unchecked");

  const supabase = await createServerSupabaseClient();
  const user = await supabase?.auth.getUser();
  const userId = user?.data.user?.id;
  if (!supabase || !userId) redirect("/login");

  const { data: existing } = await supabase
    .from("marketing_consents")
    .select("consented")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.consented) redirect("/mypage?marketing=already");

  const writeClient = createServiceRoleClient();
  if (!writeClient) redirect("/mypage?marketing=unavailable");

  const now = new Date().toISOString();
  const { error } = await writeClient.from("marketing_consents").upsert(
    {
      user_id: userId,
      consented: true,
      consented_at: now,
      training_unlocked_at: now
    },
    { onConflict: "user_id" }
  );
  if (error) redirect(`/mypage?marketing=${encodeURIComponent(error.message)}`);

  revalidatePath("/mypage");
  redirect("/mypage?marketing=consented");
}

export async function deleteAccountAction(formData: FormData) {
  if (formData.get("confirm") !== "削除する") redirect("/mypage?delete=invalid");

  const supabase = await createServerSupabaseClient();
  const user = await supabase?.auth.getUser();
  const userId = user?.data.user?.id;
  if (!supabase || !userId) redirect("/login");

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) redirect("/mypage?delete=unavailable");

  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  if (error) redirect(`/mypage?delete=${encodeURIComponent(error.message)}`);

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
