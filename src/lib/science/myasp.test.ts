import { describe, expect, it, vi } from "vitest";
import { MYASP_FIELDS, MYASP_FIELD_LABELS, emailHash, findMyaspSubscriber, mayResumeMyasp, myaspConfiguration, myaspData, myaspFreeFields, subscriber, updateMyaspFields, verifyMyaspScenario, type MyaspConfiguration, type MyaspSnapshot } from "./myasp";

const config: MyaspConfiguration = { endpoint: "https://ai.myasp.jp/test", server: "https://email.rikei-talk.com", apiKey: "test-only".repeat(4), scenario: "wTYCnyFi", origin: "https://science.example.invalid" };
const snapshot: MyaspSnapshot = { userId: "10000000-0000-4000-8000-000000000001", email: "reader@example.invalid", emailHash: emailHash("reader@example.invalid"),
  version: 3, interests: ["物理"], consents: { science: true, weekly: true, domain_opening: false }, consentUpdatedAt: "2026-09-15T08:00:00Z",
  active: false, completedKinds: ["trial"], eligibleWeek: "2026-09-14", observedAt: "2026-09-15T08:01:00Z", deliveryEnabled: false,
  remoteId: null, remoteEmailHash: null, remoteStatus: null, remoteStoppedAt: null };
const remote = { subscriber_id: "test-reader", scenario_id: config.scenario, email: snapshot.email!, status: "active", free_fields:
  (Object.keys(MYASP_FIELDS) as (keyof typeof MYASP_FIELDS)[]).map(k => ({ field_key: MYASP_FIELDS[k], field_label: MYASP_FIELD_LABELS[k], field_type: "hidden", editable: true, value: "" })) };
describe("MyASP synchronization contract (synthetic data, no live mail)", () => {
  it("verifies only the exact scenario without requesting reader data or accepting incomplete results", async () => {
    const call = vi.fn().mockResolvedValue({ scenarios: [{ scenario_id: config.scenario }], pagination: { has_more: false } });
    await expect(verifyMyaspScenario(call, config)).resolves.toBeUndefined();
    expect(call).toHaveBeenCalledOnce();
    expect(call).toHaveBeenCalledWith("get_scenarios", { scenario_id: config.scenario, include_inactive: true, include_subscriber_count: false, limit: 2, page: 1 });
    for (const result of [
      { scenarios: [], pagination: { has_more: false } },
      { scenarios: [{ scenario_id: "other" }], pagination: { has_more: false } },
      { scenarios: [{ scenario_id: config.scenario }], pagination: { has_more: true } },
      { scenarios: [{ scenario_id: config.scenario }], pagination: { has_more: false }, warnings: ["partial"] },
      { connected: true }
    ]) await expect(verifyMyaspScenario(vi.fn().mockResolvedValue(result), config)).rejects.toThrow();
  });
  it("accepts only secure, expected service endpoints and complete configuration", () => {
    const env = { SCIENCE_MYASP_MCP_URL: config.endpoint, SCIENCE_MYASP_SERVER_URL: config.server, SCIENCE_MYASP_API_KEY: config.apiKey, SCIENCE_MYASP_SCENARIO_ID: config.scenario, SCIENCE_MAIL_ORIGIN: config.origin };
    expect(myaspConfiguration(env)).toEqual(config); expect(myaspConfiguration({})).toBeNull();
    for (const url of ["http://ai.myasp.jp/mcp", "https://ai.myasp.jp.evil.invalid/mcp", "https://user:secret@ai.myasp.jp/mcp", "https://ai.myasp.jp:444/mcp"]) expect(myaspConfiguration({ ...env, SCIENCE_MYASP_MCP_URL: url })).toBeNull();
    expect(myaspConfiguration({ ...env, SCIENCE_MYASP_SERVER_URL: "https://other.example.invalid" })).toBeNull();
    expect(myaspConfiguration({ ...env, SCIENCE_MYASP_SCENARIO_ID: "NpNmIHgm" })).toBeNull();
    expect(myaspConfiguration({ ...env, SCIENCE_MAIL_ORIGIN: config.origin + "/redirect" })).toBeNull();
  });
  it("rejects partial responses and preserves exact recipient and scenario boundaries", () => {
    expect(myaspData({ result: JSON.stringify(remote) })).toMatchObject(remote);
    expect(() => myaspData({ warnings: ["attributes failed"] })).toThrow("myasp_incomplete_operation");
    expect(() => subscriber({ ...remote, scenario_id: "other123" }, config.scenario)).toThrow("myasp_identity_mismatch");
    expect(() => subscriber(remote, config.scenario, "different@example.invalid")).toThrow("myasp_identity_mismatch");
    expect(() => myaspData("not a database response")).toThrow("myasp_invalid_response");
  });
  it("checks pending records and exact email matches before creating a contact", async () => {
    const call = vi.fn().mockResolvedValueOnce({ subscribers: [{ ...remote, email: "other-reader@example.invalid" }], pagination: { has_more: false } })
      .mockResolvedValueOnce({ subscribers: [{ ...remote, status: "pending" }], pagination: { has_more: false } });
    expect((await findMyaspSubscriber(call, config, snapshot.email!))?.status).toBe("pending");
    expect(call.mock.calls[1][1]).toMatchObject({ status: "pending", scenario_id: config.scenario });
    const incomplete = vi.fn().mockResolvedValue({ subscribers: [], pagination: { has_more: true } });
    await expect(findMyaspSubscriber(incomplete, config, snapshot.email!)).rejects.toThrow("myasp_ambiguous_search");
  });
  it("separates consent and delivery, omits answered weeks, and prioritizes resuming", () => {
    const values = Object.fromEntries(myaspFreeFields(snapshot, config).map(f => [f.field_key, f.value]));
    expect(values.free33).toBe("1"); expect(values.free42).toBe("0"); expect(values.free38).toBe("2026-09-14");
    expect(values.free40).toBe("物理をもう20問");
    const resumed = Object.fromEntries(myaspFreeFields({ ...snapshot, active: true, eligibleWeek: null }, config).map(f => [f.field_key, f.value]));
    expect(resumed.free39).toBe(config.origin + "/mypage"); expect(resumed.free38).toBe("");
    const weeklyOnly = Object.fromEntries(myaspFreeFields({ ...snapshot, completedKinds: ["weekly"] }, config).map(f => [f.field_key, f.value]));
    expect(weeklyOnly.free39).toBe(config.origin + "/exam?kind=trial");
    expect(JSON.stringify(values)).not.toContain(snapshot.email);
  });
  it("never restores an unknown remote stop from a stale local grant", () => {
    expect(mayResumeMyasp(snapshot)).toBe(false);
    const stopped = { ...snapshot, remoteStatus: "unsubscribed", remoteStoppedAt: "2026-09-15T08:02:00Z" };
    expect(mayResumeMyasp(stopped)).toBe(false);
    expect(mayResumeMyasp({ ...stopped, consentUpdatedAt: "2026-09-15T08:03:00Z" })).toBe(true);
    expect(mayResumeMyasp({ ...stopped, consentUpdatedAt: "invalid" })).toBe(false);
  });
  it("writes only reserved, prepared fields and verifies every saved value", async () => {
    const fields = myaspFreeFields(snapshot, config);
    const saved = { ...remote, free_fields: remote.free_fields.map(f => ({ ...f, value: fields.find(v => v.field_key === f.field_key)!.value })) };
    const call = vi.fn().mockResolvedValueOnce(remote).mockResolvedValueOnce(saved);
    await expect(updateMyaspFields(call, config, snapshot, remote)).resolves.toMatchObject(saved);
    expect(call.mock.calls[1][0]).toBe("update_subscriber");
    expect(Object.keys(call.mock.calls[1][1])).toEqual(["subscriber_id", "free_fields"]);
    const wrongFields = { ...remote, free_fields: remote.free_fields.map(f => ({ ...f, field_label: "別の用途" })) };
    const wrong = vi.fn().mockResolvedValue(wrongFields);
    await expect(updateMyaspFields(wrong, config, snapshot, remote)).rejects.toThrow("myasp_fields_not_prepared"); expect(wrong).toHaveBeenCalledTimes(1);
    const partial = vi.fn().mockResolvedValue(remote);
    await expect(updateMyaspFields(partial, config, snapshot, remote)).rejects.toThrow("myasp_fields_not_saved");
    const revoked = vi.fn().mockResolvedValue(remote);
    await expect(updateMyaspFields(revoked, config, snapshot, remote, async () => { throw new Error("consent_changed"); })).rejects.toThrow("consent_changed");
    expect(revoked).toHaveBeenCalledTimes(1);
  });
});
