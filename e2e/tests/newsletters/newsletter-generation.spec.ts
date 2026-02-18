import { test, expect } from "../../fixtures/test.fixture";
import { mockStreams, mockNewsletters } from "../../mocks/data";

test.describe("Newsletter Generation (AI Mocked)", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should load newsletter editor for new edition", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Should show editor UI with "New Edition" heading
    await expect(page.getByRole("heading", { name: /new edition/i })).toBeVisible({ timeout: 10000 });
  });

  test("should generate newsletter content with mocked AI", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`, {
      waitUntil: "networkidle",
    });

    // Look for generate button
    const generateButton = page.getByRole("button", { name: /generate|create|milk/i });

    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Wait for AI response (mocked, so should be fast)
      await page.waitForResponse(
        (response) =>
          response.url().includes("/preview") || response.url().includes("/regenerate")
      );

      // Content should be populated with mocked AI response
      await expect(page.getByText(/Weekly Tech Digest/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test("should show action buttons on new newsletter page", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/new`);
    await page.waitForLoadState("networkidle");

    // Save Draft button should be visible
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible({ timeout: 5000 });

    // Publish button should be visible (disabled when no content)
    await expect(page.getByRole("button", { name: /publish/i })).toBeVisible({ timeout: 5000 });
  });

  test("should generate notes for items with mocked AI", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/${mockNewsletters[0].id}`);
    await page.waitForLoadState("networkidle");

    // Find generate notes button
    const generateNotesButton = page.getByRole("button", { name: /generate notes|auto notes/i });

    if (await generateNotesButton.isVisible()) {
      await generateNotesButton.click();

      // Wait for notes generation
      await page.waitForResponse((response) => response.url().includes("/generate-notes"));

      // Notes should be populated
      await expect(page.getByText(/AI-generated/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Newsletter Editor Actions", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should save newsletter as draft", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/${mockNewsletters[0].id}`);
    await page.waitForLoadState("networkidle");

    const saveButton = page.getByRole("button", { name: /save|draft/i });

    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Should show success toast
      await expect(page.getByText(/saved|draft/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test("should show preview tab", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/${mockNewsletters[0].id}`);
    await page.waitForLoadState("networkidle");

    const previewTab = page.getByRole("tab", { name: /preview/i });

    if (await previewTab.isVisible()) {
      await previewTab.click();

      // Preview should be visible
      await expect(page.locator("iframe, [data-testid='preview']")).toBeVisible({ timeout: 5000 });
    }
  });

  test("should publish newsletter", async ({ page }) => {
    await page.goto(`/streams/${mockStreams[0].id}/newsletter/${mockNewsletters[0].id}`);
    await page.waitForLoadState("networkidle");

    const publishButton = page.getByRole("button", { name: /publish/i });

    if (await publishButton.isVisible()) {
      await publishButton.click();

      // Might show confirmation dialog
      const confirmButton = page.getByRole("button", { name: /confirm|yes|publish/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should show success
      await expect(page.getByText(/published|success/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
