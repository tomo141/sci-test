import { test, expect } from "@playwright/test";

test("records a minimal return-visit event once per hour across page navigation", async ({ page }) => {
  const bodies: unknown[] = [];
  const referrers: (string | undefined)[] = [];
  await page.route("**/api/science/visit", async route => {
    bodies.push(route.request().postDataJSON());
    referrers.push(route.request().headers()["referer"]);
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"saved":true}' });
  });
  await page.goto("/about?private-note=should-not-be-sent");
  await expect.poll(() => bodies.length).toBe(1);
  expect(bodies).toEqual([{}]);
  expect(referrers).toEqual([undefined]);
  await page.goto("/about");
  await page.waitForTimeout(2300);
  expect(bodies).toHaveLength(1);
  await expect(page.getByRole("link", { name: "まずは20問で腕試しする" })).toBeVisible();
});

test("missing visitor or failed measurement never blocks the page", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/science/visit", async route => {
    calls++;
    await route.fulfill({ status: 401, contentType: "application/json", body: '{"error":"identity_required"}' });
  });
  await page.goto("/about");
  await expect.poll(() => calls).toBe(1);
  await expect(page.getByRole("link", { name: "まずは20問で腕試しする" })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("science-visit-hour"))).toBeNull();
});
