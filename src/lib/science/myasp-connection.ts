import { withMyasp } from "./myasp-client";
import { inspectMyaspFields, myaspConfiguration, verifyMyaspScenario, type MyaspConnectionCheck } from "./myasp";
import { releaseConfig, requireAdmin, type Context } from "./server";

export async function checkMyaspConnection(ctx: Context): Promise<MyaspConnectionCheck> {
  await requireAdmin(ctx);
  const release = await releaseConfig(ctx.db);
  const config = myaspConfiguration();
  const base = { observedAt: new Date().toISOString(), syncEnabled: release.myaspSync === true, deliveryEnabled: release.mailDelivery === true };
  if (!config) return { ...base, state: "not_configured" };
  try {
    const fields = await withMyasp(config, async call => { await verifyMyaspScenario(call, config); return inspectMyaspFields(call, config); });
    return { ...base, observedAt: new Date().toISOString(), state: "connected", fields };
  } catch (error) {
    // Provider errors can contain request headers or data. Never forward them to the browser.
    const allowed = ["myasp_scenario_not_verified", "myasp_invalid_response", "myasp_incomplete_operation", "myasp_operation_failed"];
    const errorCode = error instanceof Error && allowed.includes(error.message) ? error.message : "myasp_connection_failed";
    return { ...base, observedAt: new Date().toISOString(), state: "failed", errorCode };
  }
}
