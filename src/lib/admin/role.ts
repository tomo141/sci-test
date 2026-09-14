import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/src/lib/supabase/server";
export async function isAdminUser(supabase:SupabaseClient,userId:string,email?:string|null){
  void supabase;void email;
  const service=createServiceRoleClient();if(!service)return false;
  const {data,error}=await service.from("science_admins").select("user_id").eq("user_id",userId).maybeSingle();
  return !error&&!!data;
}
