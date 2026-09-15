import { randomUUID } from "node:crypto";
import { checked, releaseConfig, service } from "./server";
import { withMyasp } from "./myasp-client";
import { emailHash, findMyaspSubscriber, mayResumeMyasp, myaspConfiguration, myaspData, subscriber, updateMyaspFields, type MyaspSnapshot } from "./myasp";

export async function runMyaspSyncJobs() {
  const config = myaspConfiguration();
  if (!config) return { state: "myasp_not_configured" };
  const db = service();
  if (!(await releaseConfig(db)).myaspSync) return { state: "disabled" };
  const started = await db.rpc("science_begin_job", { p_kind: "myasp_sync" });
  if (started.error) checked(started);
  if (!started.data) return { state: "already_running" };
  const job = started.data, token = randomUUID();
  let snapshot: MyaspSnapshot | undefined;
  let outcome = "idle";
  const finish = async (status: string, error: string | null = null) => {
    if (!snapshot) return;
    if (!checked(await db.rpc("science_finish_myasp_sync", { p_user: snapshot.userId, p_token: token, p_status: status, p_error: error }))) throw new Error("myasp_lease_expired");
  };
  const current = async () => {
    const latest = checked(await db.rpc("science_myasp_snapshot", { p_user: snapshot!.userId })) as MyaspSnapshot;
    if (latest.version !== snapshot!.version || latest.emailHash !== snapshot!.emailHash) throw new Error("myasp_snapshot_changed");
    return latest;
  };
  try {
    const claim = checked(await db.rpc("science_claim_myasp_sync", { p_token: token })) as { state: string; snapshot?: MyaspSnapshot };
    if (claim.state === "claimed" && claim.snapshot) {
      snapshot = claim.snapshot;
      const initial = snapshot;
      if (!initial.remoteId && (!initial.email || !Object.values(initial.consents).some(Boolean))) outcome = "no_contact";
      else outcome = await withMyasp(config, async call => {
        if (initial.remoteId && initial.remoteEmailHash !== initial.emailHash) {
          const former = subscriber(await call("get_subscriber_details", { subscriber_id: initial.remoteId }), config.scenario);
          if (emailHash(former.email) !== initial.remoteEmailHash) throw new Error("myasp_identity_mismatch");
          if (former.status !== "unsubscribed") myaspData(await call("update_subscriber_delivery_status", { subscriber_id: former.subscriber_id, action: "unsubscribe", user_confirmed: true,
            idempotency_key: `science-detach-${initial.userId}-${initial.version}` }));
          const stopped = subscriber(await call("get_subscriber_details", { subscriber_id: former.subscriber_id }), config.scenario);
          if (stopped.status !== "unsubscribed") throw new Error("myasp_stop_not_saved");
          if (!checked(await db.rpc("science_clear_myasp_binding", { p_user: initial.userId, p_token: token, p_remote: initial.remoteId }))) throw new Error("myasp_lease_expired");
          return "detached";
        }
        const enabled = Object.values(initial.consents).some(Boolean);
        if (!initial.email) return "no_contact";
        let remote = initial.remoteId ? subscriber(await call("get_subscriber_details", { subscriber_id: initial.remoteId }), config.scenario, initial.email)
          : await findMyaspSubscriber(call, config, initial.email);
        if (!remote) {
          if (!Object.values((await current()).consents).some(Boolean)) throw new Error("myasp_snapshot_changed");
          // Data registration only: never start welcome mail, step queues, or other scenarios.
          remote = subscriber(await call("create_subscriber", { scenario_id: config.scenario, email: initial.email, user_confirmed: true,
            idempotency_key: `science-create-${initial.userId}-${initial.emailHash}`, register_stepmail: false,
            send_notification_mail: false, post_registration_mode: "none" }), config.scenario, initial.email);
        }
        if (!checked(await db.rpc("science_bind_myasp", { p_user: initial.userId, p_token: token, p_remote: remote.subscriber_id, p_email_hash: initial.emailHash }))) throw new Error("myasp_lease_expired");
        if (remote.status === "pending" || remote.status === "error") throw new Error("myasp_recipient_unavailable");
        if ((remote.status === "unsubscribed" && !mayResumeMyasp(initial)) || !enabled) {
          if (remote.status !== "unsubscribed") {
            await current();
            myaspData(await call("update_subscriber_delivery_status", { subscriber_id: remote.subscriber_id, action: "unsubscribe", user_confirmed: true,
              idempotency_key: `science-stop-${initial.userId}-${initial.version}` }));
            const stopped = subscriber(await call("get_subscriber_details", { subscriber_id: remote.subscriber_id }), config.scenario, initial.email);
            if (stopped.status !== "unsubscribed") throw new Error("myasp_stop_not_saved");
          }
          if (!checked(await db.rpc("science_record_myasp_stop", { p_user: initial.userId, p_token: token, p_remote: remote.subscriber_id }))) throw new Error("myasp_lease_expired");
          return "unsubscribed";
        }
        const saved = await updateMyaspFields(call, config, await current(), remote, async () => { await current(); });
        if (saved.status === "unsubscribed" && remote.status === "active") {
          if (!checked(await db.rpc("science_record_myasp_stop", { p_user: initial.userId, p_token: token, p_remote: remote.subscriber_id }))) throw new Error("myasp_lease_expired");
          return "unsubscribed";
        }
        if (remote.status === "unsubscribed") {
          if (!mayResumeMyasp(await current())) throw new Error("myasp_snapshot_changed");
          myaspData(await call("update_subscriber_delivery_status", { subscriber_id: remote.subscriber_id, action: "resubscribe", user_confirmed: true,
            idempotency_key: `science-resume-${initial.userId}-${initial.version}` }));
          const resumed = subscriber(await call("get_subscriber_details", { subscriber_id: remote.subscriber_id }), config.scenario, initial.email);
          if (resumed.status !== "active") throw new Error("myasp_resume_not_saved");
        }
        return "active";
      });
      await finish(outcome);
    } else outcome = claim.state;
    checked(await db.rpc("science_end_job", { p_job: job, p_state: "completed", p_summary: { outcome, synchronized: outcome === "active" ? 1 : 0 } }));
    return { state: "completed", outcome, synchronized: outcome === "active" ? 1 : 0 };
  } catch (error) {
    const code = error instanceof Error && /^myasp_[a-z_]{3,65}$/.test(error.message) ? error.message : "myasp_sync_failed";
    try { await finish("failed", code); } finally { await db.rpc("science_end_job", { p_job: job, p_state: "failed", p_summary: { errorCode: code } }); }
    return { state: "myasp_sync_failed", errorCode: code };
  }
}
