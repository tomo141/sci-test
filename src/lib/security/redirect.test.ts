import { describe, expect, it } from "vitest";
import { safeAuthRedirect } from "./redirect";

describe("authentication destination", () => {
  it.each(["//example.invalid", "/\\example.invalid", "https://example.invalid", "/%2fexample.invalid", "/%5cexample.invalid", "/bad%", "\n//example.invalid"])("rejects unsafe destination %s", (value) => {
    expect(safeAuthRedirect(value, "https://science.example")).toBe("/mypage");
  });
  it("keeps a local exam destination and its query", () => {
    expect(safeAuthRedirect("/exam?attempt=one#resume", "https://science.example")).toBe("/exam?attempt=one#resume");
  });
});
