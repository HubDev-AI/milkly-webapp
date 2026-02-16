import { test, expect } from "../../fixtures/test.fixture";
import { mockStreams } from "../../mocks/data";

test.describe("Custom Items", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should open custom item sheet when clicking add button", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Find add button (plus icon in header) - it's the third button with an svg
    const addButton = page.locator("header button").filter({ has: page.locator("svg.lucide-plus") }).first();
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    await addButton.click();

    // Sheet should open with title
    await expect(page.getByText("Add Custom Content Item")).toBeVisible({ timeout: 5000 });
  });

  test("should show form fields in custom item sheet", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Open custom item sheet
    const addButton = page.locator("header button").filter({ has: page.locator("svg.lucide-plus") }).first();
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.getByText("Add Custom Content Item")).toBeVisible({ timeout: 5000 });

    // Check form fields are visible
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/url/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
    await expect(page.getByLabel(/author/i)).toBeVisible();

    // Check buttons
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /add item/i })).toBeVisible();
  });

  test("should create custom item successfully", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Open custom item sheet
    const addButton = page.locator("header button").filter({ has: page.locator("svg.lucide-plus") }).first();
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.getByText("Add Custom Content Item")).toBeVisible({ timeout: 5000 });

    // Fill in form
    await page.getByLabel(/title/i).fill("My Test Custom Item");
    await page.getByLabel(/url/i).fill("https://example.com/test-article");
    await page.getByLabel(/description/i).fill("This is a test custom item description");
    await page.getByLabel(/author/i).fill("Test Author");

    // Click Add Item button
    await page.getByRole("button", { name: /add item/i }).click();

    // Should show success toast (use exact match to avoid strict mode violation)
    await expect(page.getByText("Custom item created", { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test("should disable Add Item button when title is empty", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Open custom item sheet
    const addButton = page.locator("header button").filter({ has: page.locator("svg.lucide-plus") }).first();
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.getByText("Add Custom Content Item")).toBeVisible({ timeout: 5000 });

    // Add Item button should be disabled when title is empty
    const submitButton = page.getByRole("button", { name: /add item/i });
    await expect(submitButton).toBeDisabled();

    // Enter title - button should become enabled
    await page.getByLabel(/title/i).fill("Test Title");
    await expect(submitButton).toBeEnabled();
  });

  test("should close sheet when clicking cancel", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Open custom item sheet
    const addButton = page.locator("header button").filter({ has: page.locator("svg.lucide-plus") }).first();
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.getByText("Add Custom Content Item")).toBeVisible({ timeout: 5000 });

    // Click cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Sheet should close
    await expect(page.getByText("Add Custom Content Item")).not.toBeVisible({ timeout: 3000 });
  });

  test("should show preview when title is entered", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Open custom item sheet - use icon-only button with Plus icon
    // The Add custom item button has class "h-9 w-9" (icon size), unlike Create Edition which has text
    const addButton = page.locator("header button.h-9.w-9").filter({ has: page.locator("svg.lucide-plus") }).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.getByText("Add Custom Content Item")).toBeVisible({ timeout: 5000 });

    // Initially no preview heading (use specific heading selector)
    await expect(page.getByRole("heading", { name: "Preview", exact: true })).not.toBeVisible();

    // Enter title
    await page.getByLabel(/title/i).fill("Preview Test Title");

    // Preview section should appear with heading
    await expect(page.getByRole("heading", { name: "Preview", exact: true })).toBeVisible();
    // The title should appear in the preview
    await expect(page.getByRole("heading", { name: "Preview Test Title" })).toBeVisible();
  });
});

test.describe("Custom Items - Edit", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should open edit sheet when clicking edit on content item", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Wait for feed items to load
    const feedCards = page.locator("main").locator("article, [class*='card']").first();
    await expect(feedCards).toBeVisible({ timeout: 5000 });

    // Find the edit button inside the main content area (not in header)
    // The edit button is inside each card with text "Edit"
    const editButton = page.locator("main button").filter({ hasText: "Edit" }).first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // Edit sheet should open - look for the sheet title
    await expect(page.getByText("Edit Content Item").or(page.getByText("Edit Custom Item"))).toBeVisible({ timeout: 3000 });
  });

  test("should update content item successfully", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Wait for feed items to load
    const feedCards = page.locator("main").locator("article, [class*='card']").first();
    await expect(feedCards).toBeVisible({ timeout: 5000 });

    // Find and click edit button inside content area
    const editButton = page.locator("main button").filter({ hasText: "Edit" }).first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // Wait for sheet to open
    await expect(page.getByText("Edit Content Item").or(page.getByText("Edit Custom Item"))).toBeVisible({ timeout: 3000 });

    // Update the title
    const titleInput = page.getByLabel(/title/i);
    await titleInput.clear();
    await titleInput.fill("Updated Item Title");

    // Click Save
    await page.getByRole("button", { name: /save changes/i }).click();

    // Should show success toast (use exact match to avoid strict mode violation)
    await expect(page.getByText("Item updated", { exact: true })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Custom Items - Delete", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should show delete button for custom items in edit sheet", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}`);
    await page.waitForLoadState("networkidle");

    // Wait for feed items to load
    const feedCards = page.locator("main").locator("article, [class*='card']").first();
    await expect(feedCards).toBeVisible({ timeout: 5000 });

    // Find the card with heading "My Custom Article" - it's the 3rd card (item-3 in mock data)
    // Each card has a heading element with the title
    const customItemHeading = page.getByRole("heading", { name: "My Custom Article" });
    await expect(customItemHeading).toBeVisible({ timeout: 5000 });

    // Find the card that contains this heading and click its edit button
    // The edit button is a sibling in the card - use the third edit button (0-indexed: .nth(2))
    const editButton = page.locator("main button").filter({ hasText: "Edit" }).nth(2);

    await editButton.click();

    // Wait for sheet to open - for custom items it shows "Edit Custom Item"
    await expect(page.getByText("Edit Custom Item")).toBeVisible({ timeout: 3000 });

    // Delete button should be visible for custom items
    await expect(page.getByRole("button", { name: /delete custom item/i })).toBeVisible();
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
    // The button shows count of custom items that can be deleted
    // Our mock has 1 custom item (item-3)
    const bulkDeleteButton = page.locator("header button").filter({ hasText: /delete/i });
    await expect(bulkDeleteButton).toBeVisible({ timeout: 3000 });
  });
});
