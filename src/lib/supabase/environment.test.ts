import { describe, expect, it } from "vitest";
import { databaseEnvironmentAllowed } from "./environment";

describe("deployment data boundary", () => {
  it("rejects production credentials inherited by previews and local builds", () => {
    const production = "https://grwaocjhfdberagsiiou.supabase.co";
    expect(databaseEnvironmentAllowed(production, "preview")).toBe(false);
    expect(databaseEnvironmentAllowed(production, "development")).toBe(false);
    expect(databaseEnvironmentAllowed(production, undefined)).toBe(false);
    expect(databaseEnvironmentAllowed(production, "production")).toBe(true);
  });
  it("permits isolated Supabase and local databases without accepting invalid URLs", () => {
    expect(databaseEnvironmentAllowed("https://isolated-test.supabase.co", "preview")).toBe(true);
    expect(databaseEnvironmentAllowed("http://127.0.0.1:54321", undefined)).toBe(true);
    expect(databaseEnvironmentAllowed("invalid", "production")).toBe(false);
  });
});
