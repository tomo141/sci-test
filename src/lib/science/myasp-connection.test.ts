import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "./server";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), release: vi.fn(), transport: vi.fn(), configuration: vi.fn() }));
vi.mock("./server", () => ({ requireAdmin: mocks.admin, releaseConfig: mocks.release }));
vi.mock("./myasp-client", () => ({ withMyasp: mocks.transport }));
vi.mock("./myasp", async importOriginal => ({ ...await importOriginal<object>(), myaspConfiguration: mocks.configuration }));
import { checkMyaspConnection } from "./myasp-connection";
const context = { db: {} } as Context;

describe("administrator mail connection boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.admin.mockResolvedValue("operator");
    mocks.release.mockResolvedValue({ myaspSync: false, mailDelivery: false });
    mocks.configuration.mockReturnValue({ scenario: "wTYCnyFi" });
  });
  it("denies an unauthorized caller before reading settings or contacting MyASP", async () => {
    mocks.admin.mockRejectedValue(new Error("forbidden"));
    await expect(checkMyaspConnection(context)).rejects.toThrow("forbidden");
    expect(mocks.release).not.toHaveBeenCalled();
    expect(mocks.transport).not.toHaveBeenCalled();
  });
  it("distinguishes missing settings from a successful read with stopped delivery", async () => {
    mocks.configuration.mockReturnValueOnce(null);
    expect((await checkMyaspConnection(context)).state).toBe("not_configured");
    expect(mocks.transport).not.toHaveBeenCalled();
    mocks.transport.mockResolvedValue(undefined);
    expect(await checkMyaspConnection(context)).toMatchObject({ state: "connected", syncEnabled: false, deliveryEnabled: false });
  });
  it("never returns provider errors containing credentials or personal data", async () => {
    mocks.transport.mockRejectedValue(new Error("X-MyASP-API-Key: test-secret; recipient: person@example.invalid"));
    const result = await checkMyaspConnection(context);
    expect(result).toMatchObject({ state: "failed", errorCode: "myasp_connection_failed" });
    expect(JSON.stringify(result)).not.toMatch(/test-secret|person@example/);
  });
});
