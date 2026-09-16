import { expect, test, type Page } from "@playwright/test";

// Browser interaction fixtures only. These routes are never installed in the product or production smoke test.
const attemptId = "30000000-0000-4000-8000-000000000071";
const questionToken = "40000000-0000-4000-8000-000000000071";
const content = { question: "検証用：1 + 1 は？", choices: ["1", "2", "3", "4"], correctIndex: 1,
  explanation: "1個と1個を合わせると2個です。\n\n詳しくは、数える操作で足し算を確かめます。",
  distractorRationales: ["1個では足りません。", "合計は2個です。", "3個は多すぎます。", "4個は多すぎます。"],
  sources: [{ title: "検証用の出典", url: "https://example.invalid/source" }] };

async function examFixture(page: Page, kind = "trial", count = 20, initialOrdinal = 0, question = content.question) {
  let ordinal = initialOrdinal, failOnce = false;
  const answers = new Map<number, number>();
  const writes: { ordinal: number; selectedIndex: number; operationId: string }[] = [];
  const stateReads: number[] = [];
  const attempt = () => ({ id: attemptId, definition: { version: "exam-v3-immediate-feedback", kind, count, domain: kind === "domain" ? "数学" : null,
    label: kind === "full" ? `総合本試験 ${count}問` : "20問の腕試し", quotas: {}, formal: ["trial", "full", "domain"].includes(kind), immediateExplanation: true },
    ordinal, state: ordinal === count ? "completed" : "active", competitive: true, result: null, completed_at: ordinal === count ? new Date().toISOString() : null });
  const progress = () => ({ answerCount: ordinal, correctCount: [...answers.values()].filter(i => i === 3).length,
    score: ordinal > 0 && ["trial", "full", "domain"].includes(kind) ? { value: kind === "domain" ? 45 : 450, low: kind === "domain" ? 10 : 250, high: kind === "domain" ? 90 : 750, scale: kind === "domain" ? "domain" : "total", unmeasuredDomains: kind === "domain" ? 0 : Math.max(0, 10 - ordinal) } : null });
  const explanation = (index: number) => ({ ordinal: index, revisionId: "fixture", content,
    correct: answers.get(index) === 3, selectedAnswer: ["3", "1", "4", "2"][answers.get(index)!], correctAnswer: "2", display: { ordinal: index, domain: "数学", subdomain: "数と代数", question, level: 4, choices: ["3", "1", "4", "2"], selectedIndex: answers.get(index), correctIndex: 3 } });
  await page.route("**/api/science/**", async route => {
    const action = new URL(route.request().url()).pathname.split("/").at(-1);
    const input = route.request().postDataJSON();
    if (action === "state") {
      stateReads.push(ordinal);
      const feedback = input.feedbackOrdinal;
      if (feedback !== undefined && !answers.has(feedback)) return route.fulfill({ status: 404, json: { error: "保存済みの回答が見つかりません。", code: "answer_not_found" } });
      return route.fulfill({ json: { attempt: attempt(), progress: progress(), group: "A", signedIn: false,
        question: feedback === undefined && ordinal < count ? { ordinal, token: questionToken, domain: "数学", subdomain: "数と代数", question, level: 4, choices: ["3", "1", "4", "2"] } : null,
        ...(feedback !== undefined ? { explanation: explanation(feedback) } : {}) } });
    }
    if (action === "answer") {
      writes.push(input);
      if (!answers.has(input.ordinal)) { answers.set(input.ordinal, input.selectedIndex); ordinal++; }
      if (failOnce) { failOnce = false; return route.abort("failed"); }
      return route.fulfill({ json: { attempt: attempt(), progress: progress(), explanation: explanation(input.ordinal) } });
    }
    return route.fulfill({ status: 503, json: { error: "この検証では利用しません。", code: "fixture_unavailable" } });
  });
  await page.goto(`/exam?attempt=${attemptId}`);
  await expect(page.getByRole("group", { name: "回答の選択肢" }).getByRole("button")).toHaveCount(4);
  return { writes, stateReads, failNextResponse: () => { failOnce = true; } };
}

test("number keys select by default, opt-in submits once, and feedback waits for an explicit next action", async ({ page }) => {
  const fixture = await examFixture(page);
  const quick = page.getByLabel("キーボードの1,2,3,4で即回答");
  await expect(quick).not.toBeChecked();
  for (const key of ["1", "2", "3", "4"]) {
    await page.keyboard.press(key);
    await expect(page.getByRole("group", { name: "回答の選択肢" }).getByRole("button").nth(Number(key) - 1)).toHaveAttribute("aria-pressed", "true");
  }
  expect(fixture.writes).toHaveLength(0);
  await expect(page.getByText("レベル4", { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("restored-question.png"), fullPage: true });
  await page.getByRole("button", { name: "この回答を確定する" }).click();
  await expect(page.getByRole("heading", { name: "正解！", exact: true })).toBeVisible();
  await expect(page.getByText("正解：2", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: content.question, exact: true })).toBeVisible();
  await expect(page.getByText("未測定の9分野", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "選択肢4：2", exact: true })).toBeDisabled();
  await page.screenshot({ path: test.info().outputPath("restored-feedback.png"), fullPage: true });
  await expect(page.getByText("1個と1個を合わせると2個です。", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "検証用の出典" })).toBeHidden();
  await page.getByText("詳しい解説・出典を見る", { exact: true }).click();
  await expect(page.getByRole("link", { name: "検証用の出典" })).toHaveAttribute("href", "https://example.invalid/source");
  await page.getByRole("button", { name: "👎 悪問・改善を報告" }).click();
  await page.getByLabel("具体的な内容").pressSequentially("1234");
  await expect(page.getByLabel("具体的な内容")).toHaveValue("1234");
  expect(fixture.writes).toHaveLength(1);
  expect(fixture.stateReads).toHaveLength(1); // No next question is exposed before the learner advances.
  await page.reload();
  await expect(page.getByRole("heading", { name: "正解！", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次の問題へ", exact: true }).click();
  await expect(page.getByRole("group", { name: "回答の選択肢" }).getByRole("button")).toHaveCount(4);
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
  await expect(page.getByText(/^1 \/ 20問 保存済み/)).toBeVisible();
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


test("a choice click immediately commits, while space advances only outside editing and controls", async ({ page }) => {
  const fixture = await examFixture(page);
  await page.getByRole("button", { name: "選択肢4：2", exact: true }).click();
  await expect(page.getByRole("heading", { name: "正解！", exact: true })).toBeVisible();
  expect(fixture.writes).toHaveLength(1);
  await page.getByRole("button", { name: "👎 悪問・改善を報告" }).click();
  await page.getByLabel("具体的な内容").fill("報告");
  await page.getByLabel("具体的な内容").press("Space");
  await expect(page.getByLabel("具体的な内容")).toHaveValue("報告 ");
  expect(fixture.stateReads).toHaveLength(1);
  await page.getByRole("heading", { name: content.question, exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByText("第 2 問", { exact: true })).toBeVisible();
  expect(fixture.stateReads).toHaveLength(2);
});

test("vector, overbar and dot notation render as drawn accents on desktop and mobile", async ({ page }) => {
  await examFixture(page, "trial", 20, 0, "3次元の位置ベクトルをr⃗とし、(∇²+k²)G(r⃗)=−δ³(r⃗)、k=ω/c>0とする。時間依存をexp(−iωt)としたとき、無限遠へ出ていく球面波に対応するGはどれか。原点からの距離r=|r⃗|>0での式を選ぶ。表記の確認：Q̇、X̄、ν̄。");
  await expect(page.locator(".science-accent-mark")).toHaveCount(7);
  for (const accent of await page.locator(".science-accent-mark").all()) await expect(accent).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("math-notation.png"), fullPage: true });
});
