import { test, expect } from "../../fixtures/test.fixture";

test.describe("Create Stream", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should display create stream page", async ({ page }) => {
    await page.goto("/streams/new");

    await expect(page.getByText("New Stream")).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByText("Categories")).toBeVisible();
    await expect(page.getByRole("button", { name: /create stream/i })).toBeVisible();
  });

  test("should show validation error for empty name", async ({ page }) => {
    await page.goto("/streams/new");

    // Try to submit without name
    await page.getByRole("button", { name: /create stream/i }).click();

    await expect(page.getByText("Name required", { exact: true })).toBeVisible();
  });

  test("should show validation error when no category selected", async ({ page }) => {
    await page.goto("/streams/new");

    // Fill name
    await page.getByLabel(/name/i).fill("Test Stream");

    // Add a keyword
    await page.getByPlaceholder(/add a keyword/i).fill("test");
    await page.getByPlaceholder(/add a keyword/i).press("Enter");

    // Try to submit
    await page.getByRole("button", { name: /create stream/i }).click();

    await expect(page.getByText("Category required", { exact: true })).toBeVisible();
  });

  test("should show category options", async ({ page }) => {
    await page.goto("/streams/new");

    // Check category labels are visible in the form
    await expect(page.locator("label").filter({ hasText: "News" })).toBeVisible();
    await expect(page.locator("label").filter({ hasText: "Videos" })).toBeVisible();
    await expect(page.locator("label").filter({ hasText: "Social" })).toBeVisible();
  });

  test("should select category by clicking checkbox", async ({ page }) => {
    await page.goto("/streams/new");

    // Click on News checkbox
    const newsCheckbox = page.locator("label").filter({ hasText: "News" }).locator('[role="checkbox"]');
    await newsCheckbox.click();

    // Checkbox should be checked
    await expect(newsCheckbox).toBeChecked();
  });

  test("should add keywords manually", async ({ page }) => {
    await page.goto("/streams/new");

    // Add keyword via input
    const keywordInput = page.getByPlaceholder(/add a keyword/i);
    await keywordInput.fill("technology");
    await keywordInput.press("Enter");

    // Keyword should appear as badge
    await expect(page.getByText("technology")).toBeVisible();
  });

  test("should remove keyword by clicking X", async ({ page }) => {
    await page.goto("/streams/new");

    // Add keyword
    const keywordInput = page.getByPlaceholder(/add a keyword/i);
    await keywordInput.fill("technology");
    await keywordInput.press("Enter");

    // Keyword should be visible
    await expect(page.getByText("technology")).toBeVisible();

    // Click X button to remove
    const removeButton = page.locator("text=technology").locator("..").locator("button");
    await removeButton.click();

    // Keyword should be removed
    await expect(page.getByText("technology")).not.toBeVisible();
  });

  test("should generate keywords with AI", async ({ page }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

    // Explicitly mock the generate-keywords endpoint for this test
    await page.route(`${backendUrl}/api/streams/generate-keywords`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            keywords: ["test-keyword-1", "test-keyword-2", "test-keyword-3"],
          },
        }),
      });
    });

    await page.goto("/streams/new");

    // Need to select a category first for keywords section to show
    const newsCheckbox = page.locator("label").filter({ hasText: "News" }).locator('[role="checkbox"]');
    await newsCheckbox.click();

    // Fill name first (required for generate)
    await page.getByLabel(/name/i).fill("AI Technology News");

    // Click generate keywords button
    await page.getByRole("button", { name: /generate keywords with ai/i }).click();

    // Wait for toast and keywords to appear
    await expect(page.getByText("Keywords generated", { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("test-keyword-1")).toBeVisible();
  });

  test("should create stream successfully", async ({ page }) => {
    await page.goto("/streams/new");

    // Fill form
    await page.getByLabel(/name/i).fill("My Test Stream");

    // Select News category
    const newsCheckbox = page.locator("label").filter({ hasText: "News" }).locator('[role="checkbox"]');
    await newsCheckbox.click();

    // Add keyword
    const keywordInput = page.getByPlaceholder(/add a keyword/i);
    await keywordInput.fill("testing");
    await keywordInput.press("Enter");

    // Submit
    await page.getByRole("button", { name: /create stream/i }).click();

    // Should show success toast
    await expect(page.getByText("Stream created", { exact: true })).toBeVisible();

    // Should navigate to new stream
    await page.waitForURL(/\/streams\/stream-/);
  });

  test("should navigate back to dashboard", async ({ page }) => {
    await page.goto("/streams/new");

    // Click back arrow (not a link with "back" text, it's an icon)
    await page.locator("header").getByRole("link").click();

    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});

test.describe("Create Stream - Sort Options", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should show sort order selection", async ({ page }) => {
    await page.goto("/streams/new");

    // Select a category first to ensure sort options show
    const newsCheckbox = page.locator("label").filter({ hasText: "News" }).locator('[role="checkbox"]');
    await newsCheckbox.click();

    // Sort order should be visible
    await expect(page.getByText("Sort Order")).toBeVisible();
  });

  test("should allow selecting different sort options", async ({ page }) => {
    await page.goto("/streams/new");

    // Select a category first
    const newsCheckbox = page.locator("label").filter({ hasText: "News" }).locator('[role="checkbox"]');
    await newsCheckbox.click();

    // Open sort dropdown
    const sortTrigger = page.locator('[role="combobox"]');
    await sortTrigger.click();

    // Select "Popular" option
    await page.getByRole("option", { name: /popular/i }).click();

    // Verify selection changed
    await expect(sortTrigger).toContainText("Popular");
  });
});
