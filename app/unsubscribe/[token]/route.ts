import { NextResponse } from "next/server";
import { tokenHash } from "@/src/lib/science/mail";
import { checked, service } from "@/src/lib/science/server";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" };
function page(text: string, status = 200, form = false) {
  return new NextResponse(`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>メールの配信停止｜全分野科学検定</title><body style="font-family:sans-serif;max-width:600px;margin:48px auto;padding:24px;line-height:1.9"><h1>メールの配信停止</h1><p>${text}</p>${form ? '<form method="post"><button name="List-Unsubscribe" value="One-Click" style="padding:14px 20px;font-size:16px">科学の案内メールをすべて停止する</button></form>' : ""}<p>配信を止めても、アカウント・受験・保存した記録はそのまま利用できます。</p><a href="/mypage">マイページへ</a></body></html>`, { status, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
}
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{64}$/.test(token)) return page("メール内の配信停止リンクから開いてください。", 400);
  // GET is safe for mail scanners and prefetch. No token/recipient lookup or mutation occurs here.
  return page("初回の案内、今週の10問、希望分野の公開通知など、全分野科学検定からの案内メールを停止します。", 200, true);
}
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{64}$/.test(token) || Number(request.headers.get("content-length")) > 4096) return page("停止手続きを確認できませんでした。メール内のリンクからお試しください。", 400);
  try {
    const raw = await request.text();
    if (raw.length > 4096) return page("入力が長すぎます。", 413);
    const type = request.headers.get("content-type") ?? "";
    let value: FormDataEntryValue | string | null = null;
    if (type.startsWith("application/x-www-form-urlencoded")) value = new URLSearchParams(raw).get("List-Unsubscribe");
    else if (type.startsWith("multipart/form-data")) value = (await new Request(request.url, { method: "POST", headers: { "content-type": type }, body: raw }).formData()).get("List-Unsubscribe");
    if (value !== "One-Click") return page("停止ボタンから操作してください。", 400);
    // The opaque mail token is the authority. RFC 8058 POST needs neither cookies nor login.
    const ok = checked(await service().rpc("science_unsubscribe_mail", { p_token_hash: tokenHash(token) }));
    return ok ? page("案内メールを停止しました。") : page("このリンクを確認できませんでした。マイページの配信設定から停止できます。", 400);
  } catch { return page("いま停止処理に接続できません。時間を置いて同じリンクから再試行してください。", 503); }
}
