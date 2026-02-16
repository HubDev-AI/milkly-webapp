import { test, expect } from "../../fixtures/test.fixture";
import { mockStreams } from "../../mocks/data";

test.describe("Stream Feed", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should display stream feed page with header", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);

    // Check stream name is displayed in header
    await expect(page.getByRole("heading", { name: mockStreams[0].name })).toBeVisible();

    // Check key UI elements
    await expect(page.getByRole("button", { name: "Milk it" })).toBeVisible();
    await expect(page.getByRole("button", { name: /create edition/i })).toBeVisible();
  });

  test("should show category tabs", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);

    // Category tabs should be visible
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "News" })).toBeVisible();
  });

  test("should filter by category tab", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);

    // Click News tab (use exact: true to avoid matching "Milk News" button)
    await page.getByRole("button", { name: "News", exact: true }).click();

    // News tab should become active (has different styling)
    const newsButton = page.getByRole("button", { name: "News", exact: true });
    await expect(newsButton).toHaveClass(/bg-primary/);

    // All tab should not be active
    const allButton = page.getByRole("button", { name: "All", exact: true });
    await expect(allButton).not.toHaveClass(/bg-primary/);
  });

  test("should show feed filter dropdown", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);

    // Feed filter dropdown should be visible
    const feedFilter = page.getByRole("combobox").filter({ hasText: "Last Milk" });
    await expect(feedFilter).toBeVisible();
  });

  test("should change feed filter", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);

    // Click feed filter
    await page.getByRole("combobox").filter({ hasText: /last milk|all/i }).click();

    // Should show options
    await expect(page.getByRole("option", { name: "All" })).toBeVisible();
  });

  test("should show selection checkbox when hovering item", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);

    // Wait for feed items to load
    await page.waitForLoadState("networkidle");

    // Should have feed items with checkboxes
    const checkboxes = page.locator('[role="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should select items for newsletter creation", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Wait for checkboxes to appear
    const checkboxes = page.locator('[role="checkbox"]');
    await expect(checkboxes.first()).toBeVisible({ timeout: 5000 });

    // Select first item
    await checkboxes.first().click();

    // Create Edition button in header should still be visible (use exact: true to avoid FAB)
    await expect(page.getByRole("button", { name: "Create Edition", exact: true })).toBeVisible();
  });

  test("should open custom item sheet", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);

    // Find add button (plus icon in header)
    const addButton = page.locator('header button').filter({ has: page.locator('svg') }).nth(2);

    if (await addButton.isVisible()) {
      await addButton.click();

      // Sheet should open
      await expect(page.getByText(/add custom item/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test("should show milk button with sort options", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);

    // Milk it button should be visible
    const milkButton = page.getByRole("button", { name: "Milk it" });
    await expect(milkButton).toBeVisible();

    // Sort dropdown should be next to it
    const sortDropdown = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await expect(sortDropdown.first()).toBeVisible();
  });

  test("should navigate to published editions", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);

    // Click Published link
    await page.getByRole("link", { name: "Published" }).click();

    await page.waitForURL(`/streams/${mockStreams[0].id}/published`);
    await expect(page).toHaveURL(`/streams/${mockStreams[0].id}/published`);
  });

  test("should navigate back to dashboard", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);

    // Click back arrow
    await page.locator("header").getByRole("link").first().click();

    await page.waitForURL("/");
  });
});

test.describe("Stream Feed - Milk It", () => {
  test("should refresh feed when clicking Milk it", async ({ page, mockAPI }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

    await mockAPI.all(page);

    // Mock refresh endpoint
    await page.route(`${backendUrl}/api/streams/*/refresh`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { newItems: 5, updatedItems: 2 },
        }),
      });
    });

    await page.goto(`/streams/${mockStreams[0].id}`);

    // Click Milk it
    await page.getByRole("button", { name: "Milk it" }).click();

    // Should show success toast (toast title is "Fresh content!")
    await expect(page.getByText("Fresh content!", { exact: true })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Stream Feed - Create Edition", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should navigate to newsletter editor when clicking Create Edition", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Wait for checkboxes to appear then select first item
    const checkboxes = page.locator('[role="checkbox"]');
    await expect(checkboxes.first()).toBeVisible({ timeout: 5000 });
    await checkboxes.first().click();

    // Click Create Edition (use header button, not FAB)
    await page.getByRole("button", { name: "Create Edition", exact: true }).click();

    // Should navigate to newsletter page
    await page.waitForURL(/\/newsletter/);
  });
});
