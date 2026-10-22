import { expect, test, type Page } from "@playwright/test";

async function clearState(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
}

test.beforeEach(async ({ page }) => clearState(page));

test("dashboard and meetings provide complete navigation", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Turn conversations into momentum." })).toBeVisible();
  await page.getByRole("link", { name: "Review meetings Catch up with summaries and transcripts" }).click();
  await expect(page).toHaveURL(/\/meetings$/);
  await expect(page.getByRole("heading", { name: "Meetings" })).toBeVisible();
  await expect(page.getByText("10", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recruiting Intelligence Demo" })).toBeVisible();
});

test("meeting search, filters, stars, sorting, and empty state work", async ({ page }) => {
  await page.goto("/meetings");
  const search = page.getByPlaceholder("Search all meeting content");
  await search.fill("Northstar Labs");
  await expect(page.getByRole("link", { name: "Open Product Launch Planning" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open Customer Discovery/ })).toHaveCount(0);
  await search.fill("");
  await page.getByLabel("Sort").selectOption("Oldest");
  await expect(page.getByRole("link", { name: "Open Quarterly Roadmap Planning" })).toBeVisible();
  await page.getByRole("button", { name: "Star meeting" }).first().click();
  await page.getByRole("button", { name: "Starred", exact: true }).click();
  await expect(page.getByRole("link", { name: /Open Quarterly Roadmap Planning/ })).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await search.fill("no such meeting phrase");
  await expect(page.getByText("No meetings match")).toBeVisible();
});

test("meeting detail exposes player semantics, transcript context, and templates", async ({ page }) => {
  await page.goto("/meetings/product-launch-planning");
  await expect(page.getByRole("heading", { name: "Product Launch Planning" })).toBeVisible();
  await expect(page.locator("video").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await expect(page.getByLabel("Seek media")).toBeVisible();
  await expect(page.getByLabel("Volume")).toBeVisible();
  await expect(page.getByLabel("Playback speed")).toHaveValue("1");
  await page.getByLabel("Playback speed").selectOption("1.5");
  await expect(page.getByLabel("Playback speed")).toHaveValue("1.5");
  await page.getByRole("button", { name: "Mute" }).click();
  await expect(page.getByRole("button", { name: "Unmute" })).toBeVisible();
  await page.getByRole("button", { name: "Transcript", exact: true }).click();
  await page.getByPlaceholder("Search transcript").fill("security review");
  await expect(page.getByText(/The twelfth is achievable/)).toBeVisible();
  await page.getByText(/The twelfth is achievable/).click();
  await expect(page.getByRole("status")).toContainText("outside the");
  await page.getByRole("button", { name: "Summary", exact: true }).click();
  await page.getByLabel("Summary template").selectOption("Executive Brief");
  await expect(page.getByText(/Leadership brief:/)).toBeVisible();
});

test("action completion persists between detail and aggregate views", async ({ page }) => {
  await page.goto("/meetings/product-launch-planning");
  await expect(page.getByText("Due Oct 23, 2026")).toBeVisible();
  await page.getByRole("button", { name: /Mark complete: Complete final security review/ }).click();
  await page.goto("/action-items");
  await expect(page.getByText("Due Oct 23, 2026")).toHaveCount(0);
  await page.getByRole("button", { name: "completed" }).click();
  await expect(page.getByText("Complete final security review by Friday.")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "completed" }).click();
  await expect(page.getByText("Complete final security review by Friday.")).toBeVisible();
});

test("personal highlights can be created, followed, and deleted", async ({ page }) => {
  await page.goto("/meetings/product-launch-planning");
  await page.getByPlaceholder("Highlight name").fill("Launch opening");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(/Launch opening · 0:00/)).toBeVisible();
  await page.goto("/highlights");
  await expect(page.getByText("Launch opening", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete Launch opening" }).click();
  await expect(page.getByText("Launch opening", { exact: true })).toHaveCount(0);
});

test("sharing offers a public meeting URL and public meeting view", async ({ page }) => {
  await page.goto("/meetings/product-launch-planning");
  await page.locator("video").first().evaluate((media) => {
    Object.defineProperty(media, "duration", { configurable: true, value: 30 });
    media.dispatchEvent(new Event("loadedmetadata"));
  });
  await page.getByRole("button", { name: "Share or clip" }).click();
  const dialog = page.getByRole("dialog", { name: "Share meeting or clip" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("input").first()).toHaveValue(/\/share\/product-launch-planning$/);
  await dialog.getByLabel("Clip title").fill("Customer proof");
  await expect(dialog.locator("input").last()).toHaveValue(/start=0&end=5&title=Customer%20proof/);
  await page.getByRole("button", { name: "Close" }).click();
  await page.goto("/share/product-launch-planning");
  await expect(page.getByText("Shared meeting")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Meeting transcript" })).toBeVisible();
  await expect(page.getByText(/simulated 0:18/)).toBeVisible();
});

test("clip URL renders nearby transcript context and honest media disclosure", async ({ page }) => {
  await page.goto("/share/product-launch-planning?start=0&end=5&title=Key%20moment");
  await expect(page.getByText("Shared clip")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Key moment" })).toBeVisible();
  await expect(page.getByText(/This short sample video demonstrates player and clip controls/)).toBeVisible();
  await expect(page.getByText(/Showing the nearest meeting context instead/)).toBeVisible();
  await expect(page.getByText(/simulated 0:18/)).toBeVisible();
});

test("desktop uses sidebar while mobile uses bottom navigation", async ({ page }, testInfo) => {
  await page.goto("/meetings");
  const desktopNav = page.getByRole("navigation", { name: "Primary", exact: true });
  const mobileNav = page.getByRole("navigation", { name: "Mobile primary" });
  if (testInfo.project.name === "mobile") {
    await expect(desktopNav).toBeHidden();
    await expect(mobileNav).toBeVisible();
    await expect(page.getByRole("heading", { name: "Meetings" })).toBeVisible();
  } else {
    await expect(desktopNav).toBeVisible();
    await expect(mobileNav).toBeHidden();
  }
});
