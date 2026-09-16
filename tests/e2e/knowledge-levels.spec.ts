import { expect, test } from "@playwright/test";
import { domains } from "../../src/lib/data/taxonomy";
import { KNOWLEDGE_LEVEL_VERSION } from "../../src/lib/science/knowledge-levels";

// Interaction fixtures only; the deployed service stores real judgements in its private database.
test("optional self-assessment distinguishes whole-domain and subdomain answers and keeps a retry identity", async ({ page }) => {
  const attemptId = "39000000-0000-4000-8000-000000000088";
  const saved: Record<string, unknown>[] = [];
  let failOnce = true;
  const result = { version: "science-3pl-p70-linear-v2", total: 500, low: 300, high: 700, answerCount: 20, correctCount: 12,
    domains: Object.fromEntries(domains.map(d => [d, { score: 50, low: 1, high: 99, count: 2 }])),
    definition: { kind: "trial", formal: true, count: 20, label: "20問の腕試し", domain: null } };
  await page.route("**/api/science/**", route => route.fulfill({ json: route.request().url().endsWith("/result") ? { attempt: { id: attemptId, ordinal: 20, state: "completed", result }, group: "A", signedIn: false, share: null } : {} }));
  await page.route("**/api/science-levels/**", route => {
    if (route.request().url().endsWith("/load")) return route.fulfill({ json: { scopes: [{ domain: "化学", subdomain: null }, { domain: "化学", subdomain: "有機化学" }], answers: [] } });
    saved.push(route.request().postDataJSON());
    if (failOnce) { failOnce = false; return route.abort("failed"); }
    return route.fulfill({ json: { saved: true, updatedAt: "2026-09-16T07:00:00Z" } });
  });
  await page.goto(`/result?attempt=${attemptId}`);
  await page.getByRole("button", { name: "1分野だけ答える（任意）", exact: true }).click();
  await expect(page.getByRole("button", { name: "この回答を保存", exact: true })).toBeDisabled();
  await page.getByRole("radio", { name: "小分野：有機化学", exact: true }).check();
  await page.getByRole("radio", { name: /該当分野の修士号取得直後/ }).check();
  await expect(page.getByText("有機化学を専門として修士号を取得した直後の人", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: /該当分野の修士号取得直後/ }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("self-assessment.png") });
  await page.getByRole("button", { name: "この回答を保存", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /通信|接続|保存/ })).toBeVisible();
  await page.getByRole("button", { name: "この回答を保存", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "小分野：化学 → 有機化学の回答を保存しました" })).toBeVisible();
  expect(saved).toHaveLength(2);
  expect(saved[0]).toEqual(saved[1]);
  expect(saved[1]).toMatchObject({ level: "master", scope: { domain: "化学", subdomain: "有機化学" }, version: KNOWLEDGE_LEVEL_VERSION });
  await expect(page.getByText("500", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("author references specify the selected field and reset after changing it", async ({ page }) => {
  const writes: Record<string, unknown>[] = [];
  await page.route("**/api/science-community/**", route => {
    if (route.request().url().endsWith("/list")) return route.fulfill({ json: { signedIn: true, open: false, questionCount: 0, drafts: [], trust: [] } });
    const input = route.request().postDataJSON(); writes.push(input);
    return route.fulfill({ json: { id: input.id, revision: 1 } });
  });
  await page.goto("/lab");
  await page.getByRole("button", { name: "問題をつくる", exact: true }).click();
  await page.getByRole("combobox", { name: "大分野", exact: true }).selectOption("化学");
  await page.getByText("どの段階の人に解けそう？（作問の目安）", { exact: true }).click();
  await page.getByRole("radio", { name: /該当分野の博士号を持つ現役研究者/ }).check();
  await page.getByRole("radio", { name: "自信がある", exact: true }).check();
  await page.getByRole("radio", { name: /該当分野の博士号を持つ現役研究者/ }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("author-reference.png") });
  await page.getByRole("button", { name: "下書きを保存", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "下書きを保存しました。" })).toBeVisible();
  expect(writes[0]).toMatchObject({ domain: "化学", subdomain: "有機化学", levelReference: { level: "doctor_research", confidence: "confident", targetProbability: .7, version: KNOWLEDGE_LEVEL_VERSION } });
  await page.getByRole("combobox", { name: "小分野", exact: true }).selectOption("無機化学");
  await expect(page.getByRole("radio", { name: /該当分野の博士号を持つ現役研究者/ })).not.toBeChecked();
  await expect(page.getByText(/無機化学を専門として博士号を取得し/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
