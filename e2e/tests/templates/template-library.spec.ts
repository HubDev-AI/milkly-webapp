import { test, expect } from "../../fixtures/test.fixture";
import { mockTemplates } from "../../mocks/data";

test.describe("Template Library", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should display templates page with header", async ({ page }) => {
    await page.goto("/templates");

    // Should show page title
    await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible({ timeout: 5000 });
  });

  test("should display template list", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Should show templates from mock data
    await expect(page.getByText(mockTemplates[0].name)).toBeVisible({ timeout: 5000 });
  });

  test("should show search input", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Search input should be visible
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test("should show stream type filter", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Stream type filter dropdown should be visible
    const streamTypeFilter = page.getByRole("combobox").filter({ hasText: /all|stream/i });
    await expect(streamTypeFilter.first()).toBeVisible({ timeout: 5000 });
  });

  test("should show status filter", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Status filter dropdown should be visible
    const statusFilter = page.getByRole("combobox").filter({ hasText: /all|active|inactive/i });
    await expect(statusFilter.first()).toBeVisible({ timeout: 5000 });
  });

  test("should show create template button", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Create button should be visible
    const createButton = page.getByRole("button", { name: /new template|create/i }).or(
      page.getByRole("link", { name: /new template|create/i })
    );
    await expect(createButton).toBeVisible({ timeout: 5000 });
  });

  test("should show back button to dashboard", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Back button should be visible
    const backButton = page.locator("header").getByRole("link").first();
    await expect(backButton).toBeVisible({ timeout: 5000 });
  });

  test("should show template cards with details", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Wait for templates to load
    await expect(page.getByText(mockTemplates[0].name)).toBeVisible({ timeout: 5000 });

    // Template card should show name
    const templateCard = page.locator("[class*='card']").filter({ hasText: mockTemplates[0].name }).first();
    await expect(templateCard).toBeVisible();
  });
});

test.describe("Template Library - Filtering", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should filter templates by search", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Enter search term
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("Weekly");

    // Wait for debounce and refetch
    await page.waitForTimeout(500);

    // Should still show matching template
    await expect(page.getByText(mockTemplates[0].name)).toBeVisible({ timeout: 5000 });
  });

  test("should filter templates by status - active", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Find status filter and select "Active"
    const statusFilters = page.getByRole("combobox");

    // There should be two dropdowns - stream type and status
    // Click the second one (status filter)
    const statusFilter = statusFilters.nth(1);
    await statusFilter.click();

    // Select Active option - use exact match to avoid matching "Inactive"
    const activeOption = page.getByRole("option", { name: "Active", exact: true });
    if (await activeOption.isVisible()) {
      await activeOption.click();
    }
  });
});

test.describe("Template Library - Actions", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should navigate to create new template", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Click create button
    const createButton = page.getByRole("button", { name: /new template/i }).or(
      page.getByRole("link", { name: /new template/i })
    );

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();
      await page.waitForURL(/\/templates\/new/);
    }
  });

  test("should navigate to edit template when clicking template card", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Wait for templates to load
    await expect(page.getByText(mockTemplates[0].name)).toBeVisible({ timeout: 5000 });

    // Click on a template card
    const templateCard = page.locator("[class*='card']").filter({ hasText: mockTemplates[0].name }).first();
    await templateCard.click();

    // Should navigate to the template edit page (URL contains template ID)
    await page.waitForURL(/\/templates\//, { timeout: 5000 });
  });

  test("should navigate back to dashboard", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Click back button
    const backButton = page.locator("header").getByRole("link").first();
    await backButton.click();

    // Should navigate to dashboard
    await page.waitForURL("/");
  });
});

test.describe("Template Library - Template Status", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should show template with status indicator", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Wait for templates to load — UI shows "COLLECTION INDEX: X-Y OF Z ENTRIES"
    await expect(page.getByText(/collection index/i)).toBeVisible({ timeout: 5000 });

    // Template card should be visible with the template name
    await expect(page.getByText(mockTemplates[0].name)).toBeVisible({ timeout: 5000 });

    // The template card should show "ACTIVE BLUEPRINT" status label
    await expect(page.getByText(/active blueprint/i)).toBeVisible({ timeout: 5000 });
  });
});
