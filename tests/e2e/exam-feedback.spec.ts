import { expect, test, type Page } from "@playwright/test";

// Browser interaction fixtures only. These routes are never installed in the product or production smoke test.
const attemptId = "30000000-0000-4000-8000-000000000071";
const questionToken = "40000000-0000-4000-8000-000000000071";
const content = { question: "検証用：1 + 1 は？", choices: ["1", "2", "3", "4"], correctIndex: 1,
  explanation: "1個と1個を合わせると2個です。\n\n詳しくは、数える操作で足し算を確かめます。",
  distractorRationales: ["1個では足りません。", "合計は2個です。", "3個は多すぎます。", "4個は多すぎます。"],
  sources: [{ title: "検証用の出典", url: "https://example.invalid/source" }] };

async function examFixture(page: Page, kind = "trial", count = 20, initialOrdinal = 0) {
  let ordinal = initialOrdinal, failOnce = false;
  const answers = new Map<number, number>();
  const writes: { ordinal: number; selectedIndex: number; operationId: string }[] = [];
  const stateReads: number[] = [];
  const attempt = () => ({ id: attemptId, definition: { version: "exam-v3-immediate-feedback", kind, count, domain: null,
    label: kind === "full" ? `総合本試験 ${count}問` : "20問の腕試し", quotas: {}, formal: true, immediateExplanation: true },
    ordinal, state: ordinal === count ? "completed" : "active", competitive: true, result: null, completed_at: ordinal === count ? new Date().toISOString() : null });
  const explanation = (index: number) => ({ ordinal: index, revisionId: "fixture", content,
    correct: answers.get(index) === 3, selectedAnswer: ["3", "1", "4", "2"][answers.get(index)!], correctAnswer: "2" });
  await page.route("**/api/science/**", async route => {
    const action = new URL(route.request().url()).pathname.split("/").at(-1);
    const input = route.request().postDataJSON();
    if (action === "state") {
      stateReads.push(ordinal);
      const feedback = input.feedbackOrdinal;
      if (feedback !== undefined && !answers.has(feedback)) return route.fulfill({ status: 404, json: { error: "保存済みの回答が見つかりません。", code: "answer_not_found" } });
      return route.fulfill({ json: { attempt: attempt(), group: "A", signedIn: false,
        question: feedback === undefined && ordinal < count ? { ordinal, token: questionToken, domain: "数学", subdomain: "数と代数", question: content.question, choices: ["3", "1", "4", "2"] } : null,
        ...(feedback !== undefined ? { explanation: explanation(feedback) } : {}) } });
    }
    if (action === "answer") {
      writes.push(input);
      if (!answers.has(input.ordinal)) { answers.set(input.ordinal, input.selectedIndex); ordinal++; }
      if (failOnce) { failOnce = false; return route.abort("failed"); }
      return route.fulfill({ json: { attempt: attempt(), explanation: explanation(input.ordinal) } });
    }
    return route.fulfill({ status: 503, json: { error: "この検証では利用しません。", code: "fixture_unavailable" } });
  });
  await page.goto(`/exam?attempt=${attemptId}`);
  await expect(page.getByRole("radio")).toHaveCount(4);
  return { writes, stateReads, failNextResponse: () => { failOnce = true; } };
}

test("number keys select by default, opt-in submits once, and feedback waits for an explicit next action", async ({ page }) => {
  const fixture = await examFixture(page);
  const quick = page.getByLabel("キーボードの1,2,3,4で即回答");
  await expect(quick).not.toBeChecked();
  for (const key of ["1", "2", "3", "4"]) {
    await page.keyboard.press(key);
    await expect(page.getByRole("radio").nth(Number(key) - 1)).toBeChecked();
  }
  expect(fixture.writes).toHaveLength(0);
  await page.getByRole("button", { name: "この回答を確定する" }).click();
  await expect(page.getByRole("heading", { name: "正解！", exact: true })).toBeVisible();
  await expect(page.getByText("正解：2", { exact: true })).toBeVisible();
  await expect(page.getByText("1個と1個を合わせると2個です。", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "検証用の出典" })).toBeHidden();
  await page.getByText("詳しい解説・出典を見る", { exact: true }).click();
  await expect(page.getByRole("link", { name: "検証用の出典" })).toHaveAttribute("href", "https://example.invalid/source");
  await page.getByRole("button", { name: "問題の改善・良かった点を伝える" }).click();
  await page.getByLabel("具体的な内容").pressSequentially("1234");
  await expect(page.getByLabel("具体的な内容")).toHaveValue("1234");
  expect(fixture.writes).toHaveLength(1);
  expect(fixture.stateReads).toHaveLength(1); // No next question is exposed before the learner advances.
  await page.reload();
  await expect(page.getByRole("heading", { name: "正解！", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次の問題へ", exact: true }).click();
  await expect(page.getByRole("radio")).toHaveCount(4);
  await quick.check();
  await page.keyboard.press("Control+1");
  expect(fixture.writes).toHaveLength(1);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "1", repeat: true, bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "2", isComposing: true, bubbles: true }));
  });
  expect(fixture.writes).toHaveLength(1);
  await page.keyboard.down("1");
  await page.keyboard.down("1");
  await page.keyboard.up("1");
  await expect(page.getByRole("heading", { name: "不正解", exact: true })).toBeVisible();
  expect(fixture.writes).toHaveLength(2);
  expect(fixture.writes[1].selectedIndex).toBe(0); // Explicit new choice, not stale React selection.
  await page.keyboard.press("2");
  expect(fixture.writes).toHaveLength(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("a lost answer response retries the same operation and still shows its explanation", async ({ page }) => {
  const fixture = await examFixture(page);
  fixture.failNextResponse();
  await page.getByLabel("キーボードの1,2,3,4で即回答").check();
  await page.keyboard.press("3");
  await expect(page.getByRole("button", { name: "同じ操作を再送する" })).toBeVisible();
  await page.keyboard.press("4");
  expect(fixture.writes).toHaveLength(1);
  await page.getByRole("button", { name: "同じ操作を再送する" }).click();
  await expect(page.getByRole("heading", { name: "不正解", exact: true })).toBeVisible();
  expect(fixture.writes).toHaveLength(2);
  expect(fixture.writes[1]).toEqual(fixture.writes[0]);
  await expect(page.getByText("1 / 20問 保存済み", { exact: true })).toBeVisible();
});

for (const [kind, count] of [["trial", 20], ["full", 50], ["full", 100], ["domain", 20], ["weekly", 10], ["lab", 10]] as const) {
  test(`${kind} ${count}: the final explanation survives reload and waits before the result`, async ({ page }) => {
    await examFixture(page, kind, count, count - 1);
    await page.keyboard.press("4");
    await page.getByRole("button", { name: "この回答を確定する" }).click();
    await expect(page.getByRole("heading", { name: "正解！", exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`feedback=${count - 1}$`));
    await page.reload();
    await expect(page.getByRole("heading", { name: "正解！", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "結果を見る", exact: true }).click();
    await expect(page).toHaveURL(`/result?attempt=${attemptId}`);
  });
}
