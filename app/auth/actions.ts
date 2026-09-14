"use server";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
export async function logoutAction(){
  const auth=await createServerSupabaseClient();
  if(!auth)throw new Error("認証サービスに接続できません。");
  const {error}=await auth.auth.signOut();
  if(error)throw new Error("ログアウトできませんでした。再試行してください。");
  redirect("/");
}
