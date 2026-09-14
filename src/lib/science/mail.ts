import { createHash, createHmac } from "node:crypto";
import { z } from "zod";
import { isScienceDomain } from "@/src/lib/data/taxonomy";
import { siteConfig } from "@/src/lib/site-config";

export const MAIL_TEMPLATE_VERSION = "science-mail-v2";
export type MailContext = {
  id: string; userId: string; email: string; nickname: string; interests: string[];
  payload: { topic: string; template: string; week?: string };
  active: { id: string; label: string | null } | null; latestResult: string | null; completedKinds: string[];
};
export type MailConfiguration = { origin: string; from: string; footer: string; unsubscribeSecret: string; host: string; port: 465 | 587; user: string; password: string };
export function mailConfiguration(env: Record<string, string | undefined> = process.env): MailConfiguration | null {
  const input = z.object({
    SCIENCE_MAIL_ORIGIN: z.string().url(), SCIENCE_MAIL_FROM: z.string().email(), SCIENCE_MAIL_FOOTER: z.string().trim().min(10).max(1000),
    SCIENCE_MAIL_UNSUBSCRIBE_SECRET: z.string().min(32), SCIENCE_SMTP_HOST: z.string().regex(/^[a-zA-Z0-9.-]+$/),
    SCIENCE_SMTP_PORT: z.enum(["465", "587"]), SCIENCE_SMTP_USER: z.string().min(1), SCIENCE_SMTP_PASSWORD: z.string().min(1)
  }).safeParse(env);
  if (!input.success) return null;
  const p = input.data, url = new URL(p.SCIENCE_MAIL_ORIGIN);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
  return { origin: url.origin, from: p.SCIENCE_MAIL_FROM, footer: p.SCIENCE_MAIL_FOOTER, unsubscribeSecret: p.SCIENCE_MAIL_UNSUBSCRIBE_SECRET,
    host: p.SCIENCE_SMTP_HOST, port: Number(p.SCIENCE_SMTP_PORT) as 465 | 587, user: p.SCIENCE_SMTP_USER, password: p.SCIENCE_SMTP_PASSWORD };
}
export function unsubscribeToken(userId: string, secret: string) {
  if (!z.string().uuid().safeParse(userId).success || secret.length < 32) throw new Error("invalid_unsubscribe_configuration");
  return createHmac("sha256", secret).update(`science-all-mail:${userId}`).digest("hex");
}
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export function escapeMailHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
function nextAction(person: MailContext) {
  if (person.active) return { label: "保存した受験を再開する", path: `/exam?attempt=${encodeURIComponent(person.active.id)}`, explanation: "途中までの回答は保存されています。続きから、自分のペースで進められます。" };
  if (!person.completedKinds.includes("trial") && !person.completedKinds.includes("full") && !person.completedKinds.includes("domain")) {
    return { label: "20問の腕試しを始める", path: "/exam?kind=trial", explanation: "まずは20問。10分野を横断して、今回の結果を科学マップで見てみましょう。" };
  }
  const interest = person.interests.find(isScienceDomain);
  if (interest || person.completedKinds.includes("full")) return { label: interest ? `${interest}をもう20問` : "分野を選んでもう20問", path: "/exam?kind=domain" + (interest ? `&domain=${encodeURIComponent(interest)}` : ""), explanation: "受験済みの記録はマイページに残っています。次は気になる分野を選んで、知識の広がりを確かめてみませんか。" };
  return { label: "総合本試験へ進む", path: "/exam?kind=full", explanation: "腕試しの次は、10分野の総合本試験へ。途中で中断して、あとから再開できます。" };
}
export function composeScienceMail(person: MailContext, config: MailConfiguration) {
  if (!z.string().uuid().safeParse(person.id).success || !z.string().email().safeParse(person.email).success) throw new Error("invalid_mail_recipient");
  const template = person.payload.template;
  if (!["welcome", "next-exam", "weekly"].includes(template)) throw new Error("unsupported_mail_template");
  let action = nextAction(person);
  let subject = template === "welcome" ? "全分野科学検定へようこそ。次の一歩はこちら" : "あなたの次の科学チャレンジ";
  let intro = template === "welcome" ? "科学の案内メールへのご登録、ありがとうございます。ともよしです。" : "ともよしです。全分野科学検定で、次に楽しめる受験をご案内します。";
  if (template === "weekly") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(person.payload.week ?? "")) throw new Error("invalid_mail_week");
    subject = `今週の10問｜${person.payload.week}の週`;
    intro = "今週の10問を公開しています。みんな同じ問題に挑み、正答数でランキングに参加できます。";
    action = person.active ? { label: "保存した受験から続きを楽しむ", path: "/mypage", explanation: "中断中の受験があります。マイページから再開できます。今週の10問は、週の受付期間内にお楽しみください。" }
      : { label: "今週の10問に挑む", path: "/exam?kind=weekly", explanation: "時間制限はありません。検索やAIを使わず、いまの自分の知識で挑戦してください。結果の公開と共有は自分で選べます。" };
  }
  const cta = new URL(action.path, config.origin);
  cta.searchParams.set("utm_source", "email"); cta.searchParams.set("utm_campaign", template); cta.searchParams.set("utm_content", MAIL_TEMPLATE_VERSION);
  const unsubscribe = `${config.origin}/unsubscribe/${unsubscribeToken(person.userId, config.unsubscribeSecret)}`;
  const settings = `${config.origin}/mypage`;
  const lines = [`${person.nickname}さん`, "", intro, "", action.explanation, "", `${action.label}\n${cta.href}`, "", "ともよし｜全分野科学検定", "制作：理系とーく 川村智祥", "", config.footer,
    `お問い合わせ：${siteConfig.legal.contactEmail}`, "", "このメールは、全分野科学検定の案内を希望された方にお送りしています。",
    `配信設定：${settings}`, `案内メールをすべて停止：${unsubscribe}`, "配信停止後も、アカウント・受験・保存した記録を利用できます。"];
  const text = lines.join("\n");
  const html = `<html lang="ja"><body><main style="max-width:600px;margin:24px auto;font-family:sans-serif;line-height:1.9;color:#18343a"><p>${escapeMailHtml(person.nickname)}さん</p><p>${escapeMailHtml(intro)}</p><p>${escapeMailHtml(action.explanation)}</p><p><a href="${escapeMailHtml(cta.href)}">${escapeMailHtml(action.label)}</a></p><p>ともよし｜全分野科学検定<br>制作：理系とーく 川村智祥</p><hr><p style="font-size:13px">${escapeMailHtml(config.footer).replace(/\n/g, "<br>")}<br>お問い合わせ：${escapeMailHtml(siteConfig.legal.contactEmail)}</p><p style="font-size:13px">このメールは案内を希望された方にお送りしています。<br><a href="${settings}">配信設定</a> ／ <a href="${unsubscribe}">案内メールをすべて停止</a><br>配信停止後も、アカウント・受験・保存した記録を利用できます。</p></main></body></html>`;
  return { from: { name: "ともよし｜全分野科学検定", address: config.from }, to: person.email, replyTo: siteConfig.legal.contactEmail,
    subject, text, html, messageId: `<science-${person.id}@${new URL(config.origin).hostname}>`,
    headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    digest: createHash("sha256").update(JSON.stringify({ version: MAIL_TEMPLATE_VERSION, subject, text, html })).digest("hex") };
}
export function mailFailure(error: unknown): { outcome: "retryable" | "blocked"; code: string } {
  const e = error as { responseCode?: number; code?: string; command?: string } | null;
  // A final 4xx SMTP reply explicitly refuses acceptance. A timeout may occur after acceptance.
  if (e?.responseCode && e.responseCode >= 400 && e.responseCode < 500) return { outcome: "retryable", code: "smtp_temporary_rejection" };
  if (e?.responseCode && e.responseCode >= 500) return { outcome: "blocked", code: "smtp_permanent_rejection" };
  if (e?.code === "EAUTH") return { outcome: "blocked", code: "smtp_authentication_failed" };
  return { outcome: "blocked", code: "delivery_outcome_unknown" };
}
