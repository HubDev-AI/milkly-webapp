import { test, expect } from "../../fixtures/test.fixture";
import { mockStreams, mockFeedItems } from "../../mocks/data";

test.describe("Custom Items", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should open custom item sheet when clicking add button", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Find add button (plus icon in header with tooltip "Add custom item")
    const addButton = page.locator("header button").filter({ has: page.locator("svg.lucide-plus") }).first();
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    await addButton.click();

    // Sheet should open with title
    await expect(page.getByText("New Custom Item")).toBeVisible({ timeout: 5000 });
  });

  test("should show form fields in custom item sheet", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Open custom item sheet
    const addButton = page.locator("header button").filter({ has: page.locator("svg.lucide-plus") }).first();
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.getByText("New Custom Item")).toBeVisible({ timeout: 5000 });

    // Check form fields are visible
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByPlaceholder("https://...")).toBeVisible();
    await expect(page.getByLabel(/editorial summary/i).or(page.getByLabel(/description/i))).toBeVisible();
    await expect(page.getByText("Category").first()).toBeVisible();
    await expect(page.getByLabel(/author/i).or(page.getByPlaceholder(/author/i))).toBeVisible();

    // Check buttons
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /add to feed/i })).toBeVisible();
  });

  test("should create custom item successfully", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Open custom item sheet
    const addButton = page.locator("header button").filter({ has: page.locator("svg.lucide-plus") }).first();
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.getByText("New Custom Item")).toBeVisible({ timeout: 5000 });

    // Fill in form
    await page.getByLabel(/title/i).fill("My Test Custom Item");
    await page.getByPlaceholder("https://...").fill("https://example.com/test-article");
    await page.getByLabel(/editorial summary/i).or(page.getByLabel(/description/i)).fill("This is a test custom item description");
    await page.getByLabel(/author/i).fill("Test Author");

    // Click Add to Feed button
    await page.getByRole("button", { name: /add to feed/i }).click();

    // Should show success toast
    await expect(page.getByText("Custom item created", { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test("should close sheet when clicking cancel", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Open custom item sheet
    const addButton = page.locator("header button").filter({ has: page.locator("svg.lucide-plus") }).first();
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.getByText("New Custom Item")).toBeVisible({ timeout: 5000 });

    // Click cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Sheet should close
    await expect(page.getByText("New Custom Item")).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Custom Items - Edit", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should open edit sheet when clicking edit on content item", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Wait for feed items with titles to load
    await expect(page.getByRole("heading", { name: mockFeedItems[0].title })).toBeVisible({ timeout: 5000 });

    // Find the edit button inside main content - scoped to main element
    const editButton = page.locator("main").getByRole("button", { name: "Edit" }).first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // Edit sheet should open (Radix Sheet has role="dialog")
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });
  });

  test("should update content item successfully", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Wait for feed items to load
    await expect(page.getByRole("heading", { name: mockFeedItems[0].title })).toBeVisible({ timeout: 5000 });

    // Click edit button in main feed area
    const editButton = page.locator("main").getByRole("button", { name: "Edit" }).first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // Wait for edit sheet to open
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });

    // Update the title
    const titleInput = page.locator("[role='dialog']").getByLabel(/title/i);
    await titleInput.clear();
    await titleInput.fill("Updated Item Title");

    // Click Save
    await page.locator("[role='dialog']").getByRole("button", { name: /save/i }).first().click();

    // Should show success toast
    await expect(page.getByText(/updated/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Custom Items - Delete", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should show delete button for custom items in edit sheet", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Find the card with heading "My Custom Article" and click its edit button
    const customItemHeading = page.getByRole("heading", { name: "My Custom Article" });
    await expect(customItemHeading).toBeVisible({ timeout: 5000 });

    // Find the edit button in main area for the custom item (third one)
    const editButton = page.locator("main").getByRole("button", { name: "Edit" }).nth(2);
    await editButton.click();

    // Wait for sheet to open
    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });

    // Delete button should be visible for custom items
    await expect(page.locator("[role='dialog']").getByRole("button", { name: /delete/i })).toBeVisible({ timeout: 5000 });
  });

  test("should show bulk delete button when custom items selected", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Select the custom item (item-3 in mock data is custom)
    const checkboxes = page.locator('[role="checkbox"]');
    await expect(checkboxes.first()).toBeVisible({ timeout: 5000 });

    // Select all items including the custom one
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Bulk delete button should appear in header for custom items
    const bulkDeleteButton = page.locator("header button").filter({ hasText: /delete/i });
    await expect(bulkDeleteButton).toBeVisible({ timeout: 3000 });
  });
});
