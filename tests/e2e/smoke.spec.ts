import { expect, test } from "@playwright/test";

test("first-time guidance leads to a trial and the laboratory has the shared navigation", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", {name:"まずは、10分野から2問ずつ"})).toBeVisible();
  await expect(page.getByRole("list", {name:"出題する10分野"}).getByRole("listitem")).toHaveCount(10);
  await expect(page.getByRole("link", {name:"まずは20問で腕試しする"})).toHaveAttribute("href", "/exam?kind=trial");
  await expect(page.getByText("作問と自己評価の共通の目安", {exact:true})).toHaveCount(0);
  await page.screenshot({path:test.info().outputPath("about.png"),fullPage:true});
  await page.getByRole("link", {name:"みんなの出題ラボへ",exact:true}).click();
  await expect(page.getByRole("heading", {name:"みんなの出題ラボ",exact:true})).toBeVisible();
  const header=page.getByRole("banner");
  const menu=header.getByRole("button", {name:"メニューを開く"});
  if(await menu.isVisible()) await menu.click();
  await expect(header.getByRole("link", {name:"検定について",exact:true})).toBeVisible();
  await expect(header.getByRole("link", {name:"受験する",exact:true})).toHaveAttribute("href","/exam");
  await expect(header.getByRole("link", {name:"マイページ",exact:true})).toHaveAttribute("href","/mypage");
  if(await header.getByRole("button",{name:"メニューを閉じる"}).isVisible()) await header.getByRole("button",{name:"メニューを閉じる"}).click();
  await page.screenshot({path:test.info().outputPath("lab-navigation.png"),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("public entrances lead to the selected exam without starting one", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "あなたの科学は、 どこまで広い？" })).toBeVisible();
  const planResponse=page.waitForResponse(response=>response.url().endsWith("/api/science/plan")&&response.request().method()==="POST");
  await page.getByRole("link", { name: "20問で腕試しする" }).click();
  await expect(page).toHaveURL(/\/exam\?kind=trial$/);
  await expect(page.getByRole("heading", { name: "20問の腕試し",level:1 })).toBeVisible();
  const response=await planResponse;
  expect(response.status()).not.toBe(403);
  if(process.env.SCIENCE_E2E_CONNECTED!=="1"){
    expect(response.status()).toBe(503);
    expect(["preview_database_not_configured","unavailable"]).toContain((await response.json()).code);
  }
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.goto("/exam?kind=domain&domain=物理");
  await expect(page.getByLabel("受験する分野")).toHaveValue("物理");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("registration explains optional mail without requesting a password or sending mail", async ({ page }) => {
  await page.goto("/signup?next=%2Fexam%3Fkind%3Dfull");
  await expect(page.getByRole("heading", { name: "無料登録して、続きを楽しもう" })).toBeVisible();
  await expect(page.getByLabel("メールアドレス", { exact: true })).toHaveAttribute("type", "email");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.getByText(/配信停止後も受験・保存は使えます/)).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("unconnected pages report unavailable data instead of fabricated rankings or accepted terms", async ({ page }) => {
  test.skip(process.env.SCIENCE_E2E_CONNECTED === "1", "This check intentionally exercises an unconnected environment.");
  await page.goto("/ranking");
  await expect(page.getByRole("alert").filter({ hasText: "ランキングを取得できませんでした" })).toBeVisible();
  await expect(page.getByText("掲載を許可した完了記録はまだありません。")).toHaveCount(0);
  await page.goto("/contribution-terms");
  await expect(page.getByRole("heading", { name: "投稿条件を取得できませんでした" })).toBeVisible();
  await page.getByRole("link", { name: "確認用の案を読む" }).click();
  await expect(page.getByRole("heading", { name: "投稿条件（確認中の案）" })).toBeVisible();
  await expect(page.getByText(/投稿の契約条件として適用しているものではありません/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("mail unsubscribe GET only shows confirmation and never claims success", async ({ page, request }) => {
  const path = `/unsubscribe/${"a".repeat(64)}`;
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("button", { name: "科学の案内メールをすべて停止する" })).toBeVisible();
  await expect(page.getByText("案内メールを停止しました。", { exact: true })).toHaveCount(0);
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response?.headers()["cache-control"]).toContain("no-store");
  const invalidPost = await request.post(path, { form: { unexpected: "prefetch" } });
  expect(invalidPost.status()).toBe(400);
  expect(await invalidPost.text()).not.toContain("案内メールを停止しました。");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("connected trial preserves progress and supports publishing and withdrawing one result", async ({ page, context }) => {
  test.skip(process.env.SCIENCE_E2E_CONNECTED !== "1", "Requires an isolated, migrated Supabase project and reviewed bank; no API mocks.");
  test.setTimeout(180_000);
  await page.goto("/exam?kind=trial");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "受験を始める", exact: true }).click();
  for (let ordinal = 0; ordinal < 20; ordinal++) {
    await expect(page.getByText(new RegExp(`^${ordinal} / 20問 保存済み`))).toBeVisible();
    if (ordinal === 3) {
      await page.reload();
      await expect(page.getByText(/^3 \/ 20問 保存済み/)).toBeVisible();
    }
    await page.getByRole("group", { name: "回答の選択肢" }).getByRole("button").first().click();
    await expect(page.getByText(`第${ordinal+1}問の答え`, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: ordinal === 19 ? "結果を見る" : "次の問題へ", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "あなたの科学マップ" })).toBeVisible();
  await page.getByLabel("公開するニックネーム").fill("独立検証の受験者");
  await page.getByRole("button", { name: "この内容で共有ページを作る" }).click();
  const sharedPath = await page.getByRole("link", { name: "公開ページを見る" }).getAttribute("href");
  expect(sharedPath).toMatch(/^\/s\/[a-f0-9-]{36}$/);
  const publicPage = await context.newPage();
  await publicPage.goto(sharedPath!);
  await expect(publicPage.getByRole("heading", { name: "あなたの科学マップ" })).toBeVisible();
  await expect(publicPage.getByRole("link", { name: "無料で20問に挑戦" })).toHaveAttribute("href", /ref=/);
  await page.getByRole("button", { name: "公開を取り消す" }).click();
  await expect(page.getByText("共有ページの公開を取り消しました。")).toBeVisible();
  const revoked = await publicPage.reload();
  expect(revoked?.status()).toBe(404);
});
