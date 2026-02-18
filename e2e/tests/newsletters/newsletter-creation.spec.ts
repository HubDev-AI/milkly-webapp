import { test, expect } from "../../fixtures/test.fixture";
import { mockStreams } from "../../mocks/data";

test.describe("Newsletter Creation", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should navigate to newsletter page when clicking Create Edition", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Click Create Edition button
    await page.getByRole("button", { name: /create edition/i }).first().click();

    // Should navigate to newsletter page
    await page.waitForURL(/\/streams\/[^/]+\/newsletter\//);
    await expect(page).toHaveURL(/\/streams\/[^/]+\/newsletter\//);
  });

  test("should show newsletter editor with empty selection", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Click Create Edition without selecting items
    await page.getByRole("button", { name: /create edition/i }).first().click();

    await page.waitForURL(/\/newsletter\//);

    // Should show editor UI
    await expect(page.getByRole("heading", { name: /new edition/i })).toBeVisible({ timeout: 5000 });

    // Should show empty selection message
    await expect(page.getByText(/canvas is empty|no items selected/i)).toBeVisible({ timeout: 5000 });
  });

  test("should navigate to newsletter page with selected items", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Wait for checkboxes to appear
    const checkboxes = page.locator('[role="checkbox"]');
    await expect(checkboxes.first()).toBeVisible({ timeout: 5000 });

    // Select first two items
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Click Create Edition
    await page.getByRole("button", { name: /create edition/i }).first().click();

    // Should navigate to newsletter page
    await page.waitForURL(/\/newsletter\//);
    await expect(page).toHaveURL(/\/newsletter\//);
  });

  test("should show FAB with selected count", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Wait for checkboxes to appear
    const checkboxes = page.locator('[role="checkbox"]');
    await expect(checkboxes.first()).toBeVisible({ timeout: 5000 });

    // Select items
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // FAB should be visible after selecting items
    const fab = page.locator("button").filter({ hasText: /create edition/i }).last();
    await expect(fab).toBeVisible({ timeout: 5000 });
  });

  test("should show edition title input on newsletter page", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Edition title input should be visible
    const titleInput = page.getByLabel(/edition title/i).or(page.getByPlaceholder(/weekly/i));
    await expect(titleInput).toBeVisible({ timeout: 5000 });
  });

  test("should show template selector on newsletter page", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Template selector should be visible
    await expect(page.getByText(/template/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("should show content items section on newsletter page", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Content items / Selected Items section should be visible
    await expect(page.getByText(/selected items|content items/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("should show Edit tab as active by default", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Details & Content tab should be active by default
    const editTab = page.getByRole("tab", { name: /details.*content/i });
    await expect(editTab).toHaveAttribute("aria-selected", "true");
  });

  test("should show Preview tab", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Preview tab should be visible
    const previewTab = page.getByRole("tab", { name: /preview/i });
    await expect(previewTab).toBeVisible();
  });

  test("should show Add Custom Item button on newsletter page", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Add Custom Item button should be visible
    await expect(page.getByRole("button", { name: /add custom item/i })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Newsletter Creation - Actions", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should show Save Draft button", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Save Draft button should be visible
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible({ timeout: 5000 });
  });

  test("should show Publish button", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Publish button should be visible (might be disabled initially)
    await expect(page.getByRole("button", { name: /publish/i })).toBeVisible({ timeout: 5000 });
  });

  test("should navigate back when clicking back button", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Click back button
    const backButton = page.locator("header button").first();
    await backButton.click();

    // Should navigate back to stream feed
    await page.waitForURL(`/streams/${mockStreams[0].id}`);
  });
});
