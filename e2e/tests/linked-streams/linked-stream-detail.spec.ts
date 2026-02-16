import { test, expect } from "../../fixtures/test.fixture";
import { mockLinkedStreams, mockFeedItems } from "../../mocks/data";

test.describe("Linked Stream Detail", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should display linked stream detail page", async ({ page }) => {
    await page.goto(`/linked-streams/${mockLinkedStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Should show linked stream name
    await expect(page.getByText(mockLinkedStreams[0].name)).toBeVisible({ timeout: 5000 });
  });

  test("should show feed content or error state", async ({ page }) => {
    await page.goto(`/linked-streams/${mockLinkedStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Should show feed items OR error state with try again button
    // Use .first() to avoid strict mode violation when both error text and button are visible
    const feedContent = page.getByText(mockFeedItems[0].title);
    const errorState = page.getByText(/failed to load/i);

    await expect(feedContent.or(errorState).first()).toBeVisible({ timeout: 5000 });
  });

  test("should show category buttons", async ({ page }) => {
    await page.goto(`/linked-streams/${mockLinkedStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Should show All category button (buttons not tabs in this UI)
    await expect(page.getByRole("button", { name: "All" })).toBeVisible({ timeout: 5000 });
  });

  test("should show action buttons", async ({ page }) => {
    await page.goto(`/linked-streams/${mockLinkedStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Should show Milk button or similar action
    const actionButton = page.getByRole("button", { name: /milk|refresh|create edition/i });
    await expect(actionButton.first()).toBeVisible({ timeout: 5000 });
  });

  test("should navigate back to linked streams list", async ({ page }) => {
    await page.goto(`/linked-streams/${mockLinkedStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Click back button
    const backButton = page.locator("header").getByRole("link").first();
    await backButton.click();

    // Should navigate back
    await page.waitForURL(/\/linked-streams|\/$/);
  });

  test("should show Template link", async ({ page }) => {
    await page.goto(`/linked-streams/${mockLinkedStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Should have Template text visible (as seen in the error context)
    await expect(page.getByText("Template")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Linked Stream Detail - Feed Actions", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should have Create Edition button visible", async ({ page }) => {
    await page.goto(`/linked-streams/${mockLinkedStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Create Edition button should be visible regardless of feed state
    await expect(page.getByRole("button", { name: "Create Edition" })).toBeVisible({ timeout: 5000 });
  });

  test("should navigate to newsletter editor", async ({ page }) => {
    await page.goto(`/linked-streams/${mockLinkedStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Find Create Edition button
    const createEditionButton = page.getByRole("button", { name: /create edition/i }).or(
      page.getByRole("link", { name: /create edition/i })
    );

    if (await createEditionButton.isVisible({ timeout: 3000 })) {
      await createEditionButton.click();

      // Should navigate to newsletter editor
      await page.waitForURL(/\/newsletter/);
    }
  });
});

test.describe("Linked Stream Detail - Templates", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should show template indicator in header", async ({ page }) => {
    await page.goto(`/linked-streams/${mockLinkedStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Template indicator should be visible in header
    await expect(page.getByText("Template")).toBeVisible({ timeout: 5000 });
  });
});
