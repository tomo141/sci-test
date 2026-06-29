import { NextResponse } from "next/server";
import { isAdminUser } from "@/src/lib/admin/role";
import { createServerSupabaseClient, createServiceRoleClient } from "@/src/lib/supabase/server";

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const user = await supabase?.auth.getUser();
  const userId = user?.data.user?.id;
  if (!supabase || !userId) return NextResponse.json({ error: "login required" }, { status: 401 });

  const admin = await isAdminUser(
    supabase,
    userId,
    user.data.user?.email ?? (user.data.user?.user_metadata?.email as string | undefined)
  );
  if (!admin) return NextResponse.json({ error: "admin required" }, { status: 403 });

  const dataClient = createServiceRoleClient() ?? supabase;
  const { data, error } = await dataClient
    .from("marketing_consents")
    .select(
      "consented_at, profiles(email, nickname, full_name, education_profiles(highest_education, specialty), score_history(score, answer_count, created_at))"
    )
    .eq("consented", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = ["メールアドレス", "メルマガ同意日時", "ニックネーム", "本名", "最新推定スコア", "得意分野", "回答数", "最終学歴", "専門分野"];
  const rows = (data || []).map((row) => {
    const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const education = Array.isArray(profileRow?.education_profiles) ? profileRow.education_profiles[0] : profileRow?.education_profiles;
    const histories = Array.isArray(profileRow?.score_history) ? profileRow.score_history : profileRow?.score_history ? [profileRow.score_history] : [];
    const latest = histories.reduce<(typeof histories)[number] | null>((current, row) => {
      if (!current) return row;
      const currentAt = current.created_at ? Date.parse(current.created_at) : 0;
      const rowAt = row.created_at ? Date.parse(row.created_at) : 0;
      return rowAt >= currentAt ? row : current;
    }, null);
    return [
      profileRow?.email,
      row.consented_at,
      profileRow?.nickname,
      profileRow?.full_name,
      latest?.score,
      "",
      latest?.answer_count,
      education?.highest_education,
      education?.specialty
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="marketing-consents.csv"'
    }
  });
}
