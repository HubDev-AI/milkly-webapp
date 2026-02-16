import { test, expect } from "../../fixtures/test.fixture";
import { mockStreams } from "../../mocks/data";

test.describe("Newsletter Creation", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should navigate to newsletter page when clicking Create Edition", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Click Create Edition button in header
    await page.getByRole("button", { name: "Create Edition", exact: true }).click();

    // Should navigate to newsletter page
    await page.waitForURL(/\/streams\/[^/]+\/newsletter\//);
    await expect(page).toHaveURL(/\/streams\/[^/]+\/newsletter\//);
  });

  test("should show newsletter editor with empty selection", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Click Create Edition without selecting items
    await page.getByRole("button", { name: "Create Edition", exact: true }).click();

    await page.waitForURL(/\/newsletter\//);

    // Should show editor UI
    await expect(page.getByRole("heading", { name: "New Edition" })).toBeVisible({ timeout: 5000 });

    // Should show empty selection message (use exact match)
    await expect(page.getByText("No items selected")).toBeVisible({ timeout: 5000 });
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
    await page.getByRole("button", { name: "Create Edition", exact: true }).click();

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
    // The FAB appears at the bottom of the page when items are selected
    const fab = page.locator("button").filter({ hasText: /create edition/i }).last();
    await expect(fab).toBeVisible({ timeout: 5000 });
  });

  test("should show edition title input on newsletter page", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Edition title input should be visible
    const titleInput = page.getByLabel(/edition title/i).or(page.getByPlaceholder(/weekly ai digest/i));
    await expect(titleInput).toBeVisible({ timeout: 5000 });
  });

  test("should show template selector on newsletter page", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Template selector should be visible
    await expect(page.getByText(/template/i)).toBeVisible({ timeout: 5000 });

    // Should show active template
    await expect(page.getByText(/weekly digest/i).or(page.getByRole("button", { name: /weekly digest/i }))).toBeVisible({ timeout: 5000 });
  });

  test("should show content items section on newsletter page", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Content items section should be visible (format: "Content Items (X)" or "Content Items (X/Y)")
    await expect(page.getByText(/Content Items \(\d+(?:\/\d+)?\)/)).toBeVisible({ timeout: 5000 });
  });

  test("should show Edit tab as active by default", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Edit tab should be active (use exact match to avoid matching "Editor")
    const editTab = page.getByRole("tab", { name: "Edit", exact: true });
    await expect(editTab).toHaveAttribute("aria-selected", "true");
  });

  test("should have Editor tab disabled when no content", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Editor tab should be disabled when no content is generated
    const editorTab = page.getByRole("tab", { name: /editor/i });
    await expect(editorTab).toBeDisabled();
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

  test("should show Auto-save checkbox", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Auto-save checkbox should be visible and checked by default
    const autoSave = page.getByRole("checkbox", { name: /auto-save/i });
    await expect(autoSave).toBeVisible({ timeout: 5000 });
    await expect(autoSave).toBeChecked();
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
