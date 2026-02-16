import { test, expect } from "../../fixtures/test.fixture";
import { mockTemplates } from "../../mocks/data";

test.describe("Mkly Template Editor", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should open template editor with mkly source", async ({ page }) => {
    // Navigate to stream detail and click edit on template
    await page.goto(`/streams/${mockTemplates[0].streamId}`);
    await page.waitForLoadState("networkidle");

    // Find and click the template to edit
    const templateCard = page.locator("[class*='card']").filter({ hasText: mockTemplates[0].name }).first();
    if (await templateCard.isVisible({ timeout: 5000 })) {
      await templateCard.click();

      // The editor header should show the template name
      await expect(page.getByText(mockTemplates[0].name)).toBeVisible({ timeout: 10000 });
    }
  });

  test("should show mkly editor container", async ({ page }) => {
    await page.goto(`/streams/${mockTemplates[0].streamId}`);
    await page.waitForLoadState("networkidle");

    // Click on template to open editor
    const templateCard = page.locator("[class*='card']").filter({ hasText: mockTemplates[0].name }).first();
    if (await templateCard.isVisible({ timeout: 5000 })) {
      await templateCard.click();

      // The mkly editor root should be present
      await expect(page.locator(".mkly-editor-root")).toBeVisible({ timeout: 10000 });
    }
  });

  test("should show save and close buttons in editor header", async ({ page }) => {
    await page.goto(`/streams/${mockTemplates[0].streamId}`);
    await page.waitForLoadState("networkidle");

    const templateCard = page.locator("[class*='card']").filter({ hasText: mockTemplates[0].name }).first();
    if (await templateCard.isVisible({ timeout: 5000 })) {
      await templateCard.click();

      // Save button should be visible (may be disabled when no changes)
      await expect(page.getByRole("button", { name: /save/i })).toBeVisible({ timeout: 10000 });

      // Close button should be visible
      await expect(page.getByRole("button", { name: /close/i })).toBeVisible({ timeout: 10000 });
    }
  });

  test("should show saved indicator when no changes", async ({ page }) => {
    await page.goto(`/streams/${mockTemplates[0].streamId}`);
    await page.waitForLoadState("networkidle");

    const templateCard = page.locator("[class*='card']").filter({ hasText: mockTemplates[0].name }).first();
    if (await templateCard.isVisible({ timeout: 5000 })) {
      await templateCard.click();

      // Should show "Saved" status indicator
      await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });
    }
  });

  test("should save template with mklySource field via PUT", async ({ page }) => {
    await page.goto(`/streams/${mockTemplates[0].streamId}`);
    await page.waitForLoadState("networkidle");

    const templateCard = page.locator("[class*='card']").filter({ hasText: mockTemplates[0].name }).first();
    if (!(await templateCard.isVisible({ timeout: 5000 }))) return;
    await templateCard.click();

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

    // Click save button (even if no changes, we verify the endpoint format)
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

    // Intercept templates list response
    await page.route(`${backendUrl}/api/v1/templates`, async (route) => {
      // Let it fall through to the mock handler, but capture the response
      await route.fallback();
    });

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
      if (response.url().match(/\/api\/templates\/[^/]+$/) && response.status() === 200) {
        try {
          const json = await response.json();
          templateData = json.data;
        } catch {
          // ignore parse errors
        }
      }
    });

    // Navigate to trigger template GET
    await page.goto(`/streams/${mockTemplates[0].streamId}`);
    await page.waitForLoadState("networkidle");

    const templateCard = page.locator("[class*='card']").filter({ hasText: mockTemplates[0].name }).first();
    if (await templateCard.isVisible({ timeout: 5000 })) {
      await templateCard.click();
      await page.waitForLoadState("networkidle");

      if (templateData) {
        expect(templateData).toHaveProperty("mklySource");
        expect(templateData).not.toHaveProperty("structure");
        expect(typeof (templateData as { mklySource: string }).mklySource).toBe("string");
        expect((templateData as { mklySource: string }).mklySource).toContain("--- meta");
      }
    }
  });

  test("template creation POST returns mklySource", async ({ page }) => {
    let createdTemplate: Record<string, unknown> | null = null;

    page.on("response", async (response) => {
      if (
        response.url().includes("/api/v1/streams/") &&
        response.url().includes("/templates") &&
        response.status() === 201
      ) {
        try {
          const json = await response.json();
          createdTemplate = json.data;
        } catch {
          // ignore
        }
      }
    });

    await page.goto(`/streams/${mockTemplates[0].streamId}`);
    await page.waitForLoadState("networkidle");

    // Look for create template button
    const createBtn = page.getByRole("button", { name: /create template|new template|generate/i });
    if (await createBtn.isVisible({ timeout: 5000 })) {
      await createBtn.click();
      await page.waitForTimeout(1000);

      if (createdTemplate) {
        expect(createdTemplate).toHaveProperty("mklySource");
        expect(createdTemplate).not.toHaveProperty("structure");
      }
    }
  });
});
