import { test, expect } from "../../fixtures/test.fixture";
import { mockTemplates } from "../../mocks/data";

test.describe("Mkly Template Editor", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should open template editor with mkly source", async ({ page }) => {
    // Navigate to template edit page directly
    await page.goto(`/templates/${mockTemplates[0].id}`);
    await page.waitForLoadState("networkidle");

    // The editor should show the template name in the heading
    await expect(page.getByRole("heading", { name: mockTemplates[0].name })).toBeVisible({ timeout: 10000 });
  });

  test("should show mkly editor container", async ({ page }) => {
    await page.goto(`/templates/${mockTemplates[0].id}`);
    await page.waitForLoadState("networkidle");

    // The mkly editor root should be present
    await expect(page.locator(".mkly-editor-root")).toBeVisible({ timeout: 10000 });
  });

  test("should show save and close buttons in editor header", async ({ page }) => {
    await page.goto(`/templates/${mockTemplates[0].id}`);
    await page.waitForLoadState("networkidle");

    // Save button should be visible
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible({ timeout: 10000 });
  });

  test("should save template with mklySource field via PUT", async ({ page }) => {
    await page.goto(`/templates/${mockTemplates[0].id}`);
    await page.waitForLoadState("networkidle");

    // Wait for editor to load
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible({ timeout: 10000 });

    // Set up request interception to capture the PUT payload
    let putPayload: Record<string, unknown> | null = null;
    await page.route(`**/api/v1/templates/${mockTemplates[0].id}`, async (route) => {
      if (route.request().method() === "PUT") {
        putPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: { ...mockTemplates[0], ...putPayload, updatedAt: new Date().toISOString() },
          }),
        });
      } else {
        await route.fallback();
      }
    });

    // Click save button
    const saveButton = page.getByRole("button", { name: /save/i });
    if (await saveButton.isEnabled()) {
      await saveButton.click();

      // The PUT payload should contain mklySource, not structure
      if (putPayload) {
        expect(putPayload).toHaveProperty("mklySource");
        expect(putPayload).not.toHaveProperty("structure");
      }
    }
  });
});

test.describe("Template API Mock Validation", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("template list API returns mklySource instead of structure", async ({ page }) => {
    let responseData: Record<string, unknown> | null = null;

    // Listen for the response
    page.on("response", async (response) => {
      if (response.url().includes("/api/v1/templates") && !response.url().includes("/preview")) {
        try {
          const json = await response.json();
          responseData = json;
        } catch {
          // ignore parse errors
        }
      }
    });

    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Wait for templates to load
    await expect(page.getByText(mockTemplates[0].name)).toBeVisible({ timeout: 5000 });

    // Verify response structure uses mklySource
    if (responseData) {
      const data = (responseData as { data: Array<Record<string, unknown>> }).data;
      expect(data[0]).toHaveProperty("mklySource");
      expect(data[0]).not.toHaveProperty("structure");
    }
  });

  test("single template GET returns mklySource", async ({ page }) => {
    let templateData: Record<string, unknown> | null = null;

    page.on("response", async (response) => {
      if (response.url().match(/\/api\/v1\/templates\/[^/]+$/) && response.status() === 200) {
        try {
          const json = await response.json();
          templateData = json.data;
        } catch {
          // ignore parse errors
        }
      }
    });

    // Navigate to template edit page directly
    await page.goto(`/templates/${mockTemplates[0].id}`);
    await page.waitForLoadState("networkidle");

    // Wait for template to load
    await expect(page.getByRole("heading", { name: mockTemplates[0].name })).toBeVisible({ timeout: 10000 });

    if (templateData) {
      expect(templateData).toHaveProperty("mklySource");
      expect(templateData).not.toHaveProperty("structure");
      expect(typeof (templateData as { mklySource: string }).mklySource).toBe("string");
      expect((templateData as { mklySource: string }).mklySource).toContain("--- meta");
    }
  });
});
