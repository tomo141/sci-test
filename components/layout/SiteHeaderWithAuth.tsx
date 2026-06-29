import { SiteHeader } from "@/components/layout/SiteHeader";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

type Props = {
  compact?: boolean;
};

export async function SiteHeaderWithAuth({ compact = false }: Props) {
  const supabase = await createServerSupabaseClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return <SiteHeader compact={compact} isLoggedIn={!!user} />;
}
