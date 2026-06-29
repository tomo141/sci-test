"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { syncAdminRoleIfAllowed } from "@/src/lib/admin/role";
import { getAdminEmails, getAppUrl } from "@/src/lib/env";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { verifyTurnstile } from "@/src/lib/security/turnstile";

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    passwordConfirm: z.string().min(8),
    nickname: z.string().max(40).optional(),
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

export async function signupAction(formData: FormData) {
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
    await supabase.from("marketing_consents").upsert({
      user_id: userId,
      consented: marketingConsent === "on",
      consented_at: marketingConsent === "on" ? new Date().toISOString() : null,
      training_unlocked_at: marketingConsent === "on" ? new Date().toISOString() : null
    });
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

export async function loginAction(formData: FormData) {
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
