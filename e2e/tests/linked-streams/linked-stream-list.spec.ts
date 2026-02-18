import { test, expect } from "../../fixtures/test.fixture";
import { mockLinkedStreams } from "../../mocks/data";

test.describe("Linked Stream List", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should display linked streams page with header", async ({ page }) => {
    await page.goto("/linked-streams");

    // Should show page title
    await expect(page.getByText("Linked").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Streams").first()).toBeVisible({ timeout: 5000 });
  });

  test("should display linked streams list", async ({ page }) => {
    await page.goto("/linked-streams");
    await page.waitForLoadState("networkidle");

    // Should show linked streams from mock data
    await expect(page.getByText(mockLinkedStreams[0].name)).toBeVisible({ timeout: 5000 });
  });

  test("should show create linked stream button", async ({ page }) => {
    await page.goto("/linked-streams");
    await page.waitForLoadState("networkidle");

    // Create button should be visible - "New Stream" or "New Linked Stream"
    const createButton = page.getByRole("button", { name: /new.*stream/i }).or(
      page.getByRole("link", { name: /new.*stream/i })
    );
    await expect(createButton.first()).toBeVisible({ timeout: 5000 });
  });

  test("should show linked stream card with details", async ({ page }) => {
    await page.goto("/linked-streams");
    await page.waitForLoadState("networkidle");

    // Wait for linked streams to load
    await expect(page.getByText(mockLinkedStreams[0].name)).toBeVisible({ timeout: 5000 });

    // Should show description
    if (mockLinkedStreams[0].description) {
      await expect(page.getByText(mockLinkedStreams[0].description)).toBeVisible({ timeout: 5000 });
    }
  });

  test("should navigate to linked stream detail when clicking", async ({ page }) => {
    await page.goto("/linked-streams");
    await page.waitForLoadState("networkidle");

    // Wait for linked streams to load
    await expect(page.getByText(mockLinkedStreams[0].name)).toBeVisible({ timeout: 5000 });

    // Click on the linked stream
    await page.getByText(mockLinkedStreams[0].name).click();

    // Should navigate to linked stream detail page
    await page.waitForURL(new RegExp(`/linked-streams/${mockLinkedStreams[0].id}`));
  });

  test("should navigate back to dashboard", async ({ page }) => {
    await page.goto("/linked-streams");
    await page.waitForLoadState("networkidle");

    // Click back button
    const backButton = page.locator("header").getByRole("link").first();
    await backButton.click();

    // Should navigate to dashboard
    await page.waitForURL("/");
  });
});

test.describe("Linked Stream List - Empty State", () => {
  test("should show empty state when no linked streams", async ({ page, mockAPI }) => {
    // Set up auth and other mocks but override linked streams
    await mockAPI.auth(page);
    await mockAPI.streams(page);
    await mockAPI.subscription(page);

    // Mock empty linked streams
    const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";
    await page.route(new RegExp(`${backendUrl.replace(/\./g, "\\.")}/api/v1/linked-streams(\\?|$)`), async (route) => {
      const url = route.request().url();
      const pathname = new URL(url).pathname;

      if (pathname !== "/api/v1/linked-streams") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        }),
      });
    });

    await page.goto("/linked-streams");
    await page.waitForLoadState("networkidle");

    // Should show empty state message - "Draft your first Editorial Fusion" or "Create Fusion" button
    await expect(
      page.getByRole("button", { name: /create fusion/i }).or(page.getByRole("link", { name: /create fusion/i }))
    ).toBeVisible({ timeout: 5000 });
  });
});
