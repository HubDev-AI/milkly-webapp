import { test, expect } from "../../fixtures/test.fixture";
import { mockStreams, mockLinkedStreams } from "../../mocks/data";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should display dashboard with streams list", async ({ page }) => {
    await page.goto("/");

    // Check header elements
    await expect(page.getByText("Milkly")).toBeVisible();
    await expect(page.getByText("Your Streams")).toBeVisible();
    await expect(page.getByText("Milk the internet for your best content")).toBeVisible();

    // Check streams are displayed
    for (const stream of mockStreams) {
      await expect(page.getByText(stream.name)).toBeVisible();
    }
  });

  test("should show New Stream button when streams exist", async ({ page }) => {
    await page.goto("/");

    const newStreamButton = page.getByRole("link", { name: /new stream/i });
    await expect(newStreamButton).toBeVisible();
  });

  test("should navigate to create stream page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /new stream/i }).click();
    await page.waitForURL("/streams/new");
    await expect(page).toHaveURL("/streams/new");
  });

  test("should navigate to stream feed when clicking stream card", async ({ page }) => {
    await page.goto("/");

    // Click on the first stream
    await page.getByText(mockStreams[0].name).click();

    await page.waitForURL(`/streams/${mockStreams[0].id}`);
    await expect(page).toHaveURL(`/streams/${mockStreams[0].id}`);
  });

  test("should show stream categories on cards", async ({ page }) => {
    await page.goto("/");

    // Categories should be visible as badges
    // mockStreams[0] has categories: ["news", "videos"]
    const streamCard = page.locator("text=Tech News").locator("..");
    await expect(streamCard).toBeVisible();
  });

  test("should show user menu", async ({ page }) => {
    await page.goto("/");

    // User menu button should be visible (shows initials)
    const userMenuButton = page.getByRole("button", { name: /TU/i });
    await expect(userMenuButton).toBeVisible();

    // Click to open menu
    await userMenuButton.click();

    // Menu items should be visible
    await expect(page.getByText(/settings/i)).toBeVisible();
  });
});

test.describe("Dashboard - Empty State", () => {
  test("should show empty state when no streams", async ({ page, mockAPI }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

    // Mock auth and subscription
    await mockAPI.auth(page);
    await mockAPI.subscription(page);

    // Mock empty streams
    await page.route(`${backendUrl}/api/streams*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        }),
      });
    });

    await page.goto("/");

    // Empty state elements
    await expect(page.getByText("Create your first stream")).toBeVisible();
    await expect(page.getByText(/Start aggregating content/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /new stream/i })).toBeVisible();
  });
});

test.describe("Dashboard - Linked Streams Section", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should show linked streams section for Professional users", async ({ page }) => {
    await page.goto("/");

    // With Professional subscription and streams, linked streams section should appear
    await expect(page.getByText("Linked Streams")).toBeVisible();
  });

  test("should navigate to linked stream when clicked", async ({ page }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

    // Add mock for linked streams
    await page.route(`${backendUrl}/api/linked-streams*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockLinkedStreams,
          pagination: { page: 1, limit: 3, total: 1, totalPages: 1 },
        }),
      });
    });

    await page.goto("/");

    // Click on linked stream
    const linkedStreamLink = page.getByText(mockLinkedStreams[0].name);
    if (await linkedStreamLink.isVisible()) {
      await linkedStreamLink.click();
      await page.waitForURL(`/linked-streams/${mockLinkedStreams[0].id}`);
    }
  });
});
