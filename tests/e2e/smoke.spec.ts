import { expect, test } from "@playwright/test";

test("top page and exam flow render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /あなたの科学力/ })).toBeVisible();
  await page.getByRole("link", { name: /今すぐ腕試し/ }).click();
  await expect(page.getByRole("heading", { name: "腕試し受験ページ" })).toBeVisible();
  await page.getByRole("button", { name: /1/ }).first().click();
  await expect(page.getByText(/正解！|不正解！/)).toBeVisible();
});
