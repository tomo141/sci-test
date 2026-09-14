import { randomUUID } from "node:crypto";
import { createTransport } from "nodemailer";
import { checked, releaseConfig, service } from "./server";
import { composeScienceMail, mailConfiguration, mailFailure, tokenHash, unsubscribeToken, type MailContext } from "./mail";

export async function runMailJobs() {
  const config = mailConfiguration();
  if (!config) return { state: "mail_not_configured" };
  const db = service();
  const release = await releaseConfig(db);
  if (!release.mailDelivery || !release.newAttempts) return { state: "disabled" };
  const started = await db.rpc("science_begin_job", { p_kind: "mail" });
  if (started.error) checked(started);
  if (!started.data) return { state: "already_running" };
  const job = started.data as string;
  const summary: Record<string, unknown> = { accepted: 0, observedAt: new Date().toISOString() };
  try {
    summary.recovered = checked(await db.rpc("science_recover_stalled_mail"));
    summary.weekly = checked(await db.rpc("science_queue_weekly_mail", { p_limit: 500 }));
    const due = checked(await db.from("science_outbox").select("id,user_id").eq("kind", "mail").in("state", ["pending", "failed"]).lte("available_at", new Date().toISOString()).order("available_at").order("id").limit(20));
    // A bounded invocation makes one SMTP transaction; skipped/cancelled queue rows do not stall it.
    const claimDeadline = Date.now() + 10000;
    for (const item of due) {
      if (Date.now() >= claimDeadline) break;
      if (!item.user_id) continue;
      const claimToken = randomUUID();
      const claim = checked(await db.rpc("science_claim_mail", { p_message: item.id, p_token: claimToken, p_unsubscribe_hash: tokenHash(unsubscribeToken(item.user_id, config.unsubscribeSecret)) })) as { state: string } & Partial<MailContext>;
      if (claim.state !== "claimed") continue;
      let message: ReturnType<typeof composeScienceMail>;
      try { message = composeScienceMail(claim as MailContext, config); }
      catch { checked(await db.rpc("science_finish_mail", { p_message: item.id, p_token: claimToken, p_outcome: "blocked", p_error_code: "invalid_message_content" })); continue; }
      const authorized = checked(await db.rpc("science_authorize_mail", { p_message: item.id, p_token: claimToken, p_content_hash: message.digest }));
      if (!authorized) continue;
      const transport = createTransport({ host: config.host, port: config.port, secure: config.port === 465, requireTLS: true,
        auth: { user: config.user, pass: config.password }, tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
        connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000, dnsTimeout: 5000,
        disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false });
      let result: { outcome: "accepted" | "retryable" | "blocked"; code?: string; providerId?: string };
      try {
        const { digest: _digest, ...data } = message; void _digest;
        const sent = await transport.sendMail(data);
        result = sent.accepted.length === 1 && sent.rejected.length === 0 ? { outcome: "accepted", providerId: sent.messageId } : { outcome: "blocked", code: "recipient_not_accepted" };
      } catch (error) { result = mailFailure(error); }
      finally { transport.close(); }
      const recorded = checked(await db.rpc("science_finish_mail", { p_message: item.id, p_token: claimToken, p_outcome: result.outcome, p_provider_id: result.providerId ?? null, p_error_code: result.code ?? null }));
      if (!recorded) throw new Error("mail_outcome_not_recorded");
      summary.accepted = result.outcome === "accepted" ? 1 : 0;
      summary.outcome = result.outcome;
      break;
    }
    checked(await db.rpc("science_end_job", { p_job: job, p_state: "completed", p_summary: summary }));
    return { state: "completed", ...summary };
  } catch (error) {
    await db.rpc("science_end_job", { p_job: job, p_state: "failed", p_summary: { ...summary, errorType: error instanceof Error ? error.name : "unknown" } });
    throw error;
  }
}
