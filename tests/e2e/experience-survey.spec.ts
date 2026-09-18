import { expect, test, type Page } from "@playwright/test";
import { domains } from "../../src/lib/data/taxonomy";
import { EXPERIENCE_SURVEY_VERSION } from "../../src/lib/science/experience-survey";

// Synthetic browser fixtures only. No production accounts, responses or emails.
const attemptId = "39000000-0000-4000-8000-000000000099";
async function resultFixture(page: Page, kind = "trial", count = 20, failOnce = false) {
  let saved: Record<string, unknown> | null = null;
  const writes: Record<string, unknown>[] = [];
  const result = { version: "science-3pl-p70-linear-v2", total: 500, low: 300, high: 700, answerCount: count, correctCount: count * .7,
    domains: Object.fromEntries(domains.map(d => [d, { score: 50, low: 1, high: 99, count: count / 10 }])),
    definition: { kind, formal: kind !== "weekly", count, label: kind === "full" ? `総合本試験 ${count}問` : "20問の腕試し", domain: null } };
  await page.route("**/api/science/**", async route => {
    const action = new URL(route.request().url()).pathname.split("/").at(-1);
    if (action === "result") return route.fulfill({ json: { attempt: { id: attemptId, ordinal: count, state: "completed", result }, group: "A", signedIn: false, share: null } });
    if (action === "experience_read") return route.fulfill({ json: { response: saved } });
    if (action === "experience_save") {
      const input = route.request().postDataJSON(); writes.push(input);
      saved ??= { response: input.response, context: { kind, questionCount: count }, submittedAt: "2026-09-18T15:00:00Z" };
      if (failOnce) { failOnce = false; return route.abort("failed"); }
      return route.fulfill({ json: { response: saved } });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto(`/result?attempt=${attemptId}`);
  return { writes };
}
test("optional survey keeps results available, preserves choices on failure and restores saved responses", async ({ page }) => {
  const f = await resultFixture(page, "trial", 20, true);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByText("500", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "総合本試験へ", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "受験の感想を伝える", exact: true }).click();
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await page.getByRole("button", { name: "感想を送信する", exact: true }).click();
  expect(f.writes).toHaveLength(0);
  await page.getByRole("group", { name: "問題の難易度", exact: true }).getByLabel("やや難しかった", { exact: true }).check();
  await page.getByLabel("さくさく進めた", { exact: true }).check();
  const comment = "合成検証の感想 <script>throw Error('unsafe')</script>";
  await page.getByLabel("ひとこと（任意）", { exact: true }).fill(comment);
  await page.getByRole("button", { name: "感想を送信する", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "通信できませんでした" })).toBeVisible();
  await expect(page.getByLabel("やや難しかった", { exact: true })).toBeChecked();
  await expect(page.getByLabel("ひとこと（任意）", { exact: true })).toHaveValue(comment);
  await page.getByRole("button", { name: "感想を送信する", exact: true }).click();
  await expect(page.getByText("回答を保存しました。ありがとうございます。", { exact: true })).toBeVisible();
  expect(f.writes).toHaveLength(2); expect(f.writes[0]).toEqual(f.writes[1]);
  expect(f.writes[0]).toEqual({ attemptId, response: { version: EXPERIENCE_SURVEY_VERSION, difficulty: "hard", tempo: "smooth", comment } });
  await page.reload(); await page.getByRole("button", { name: "受験の感想を伝える", exact: true }).click();
  await expect(page.getByText(comment, { exact: true })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("survey-saved.png") });
});
test("full 100-question exam accepts ratings without free text", async ({ page }) => {
  const f = await resultFixture(page, "full", 100);
  await page.getByRole("button", { name: "受験の感想を伝える", exact: true }).click();
  await page.getByRole("group", { name: "問題の難易度", exact: true }).getByLabel("ちょうどよかった", { exact: true }).check();
  await page.getByLabel("判断できない", { exact: true }).check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("survey-form.png") });
  await page.getByRole("button", { name: "感想を送信する", exact: true }).click();
  await expect(page.getByText("回答を保存しました。ありがとうございます。", { exact: true })).toBeVisible();
  expect(f.writes[0]).toMatchObject({ response: { comment: "", tempo: "unsure" } });
});
test("weekly result has no trial/full survey", async ({ page }) => {
  await resultFixture(page, "weekly", 10);
  await expect(page.getByRole("heading", { name: "この結果を、科学好きな人へ" })).toBeVisible();
  await expect(page.getByRole("button", { name: "受験の感想を伝える", exact: true })).toHaveCount(0);
});
test("operator can read private survey pages without account identifiers", async ({ page }) => {
  const pages: number[] = [];
  await page.route("**/api/science-admin/**", route => {
    if (route.request().url().endsWith("/list")) return route.fulfill({ json: { observedAt: "2026-09-18T15:00:00Z", metrics: [], experiment: { rows: [] }, repeats: null, quality: [], submissions: [], feedback: [], corrections: [], holds: [], jobs: [] } });
    const { page: offset } = route.request().postDataJSON(); pages.push(offset);
    return route.fulfill({ json: { page: offset, hasMore: offset === 0, rows: offset ? [] : [{ id: "synthetic-event", submittedAt: "2026-09-18T15:00:00Z", context: { kind: "trial", questionCount: 20, correctCount: 14, answerCount: 20, score: 500, low: 300, high: 700, selectionPolicy: "trial-fluency-v1", releaseId: "synthetic-bank", definitionVersion: "fixture", modelVersion: "p70" }, response: { version: EXPERIENCE_SURVEY_VERSION, difficulty: "hard", tempo: "smooth", comment: "合成アンケートの感想" } }] } });
  });
  await page.goto("/admin");
  await page.getByRole("button", { name: "アンケートを確認", exact: true }).click();
  await expect(page.getByText("合成アンケートの感想", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次の20件", exact: true }).click();
  await expect(page.getByText("このページに回答はありません。", { exact: true })).toBeVisible();
  expect(pages).toEqual([0, 1]);
});
