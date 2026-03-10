import { test, expect } from "../../fixtures/test.fixture";
import { mockUser } from "../../mocks/data";

test.describe("Account Settings", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should display account settings page with header", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Should show page title - "Account"
    await expect(page.getByText("Account").first()).toBeVisible();
    await expect(page.getByText(/calibrate your core parameters/i)).toBeVisible();
  });

  test("should show identity card with user information", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Identity card should be visible
    await expect(page.getByRole("heading", { name: "Identity" })).toBeVisible();
    await expect(page.getByText("Core Profile manifest")).toBeVisible();

    // User info should be shown
    await expect(page.getByText(mockUser.name)).toBeVisible();
    await expect(page.getByText(mockUser.email)).toBeVisible();
  });

  test("should show export data card", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Export card should be visible - "Manifest Extraction"
    await expect(page.getByText("Manifest Extraction")).toBeVisible();
    await expect(page.getByText("Historical Archive Access")).toBeVisible();

    // Export button should be visible - "Initiate Extraction"
    await expect(page.getByRole("button", { name: /initiate extraction/i })).toBeVisible();
  });

  test("should show danger zone card", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Danger zone card should be visible - "Terminal Protocol"
    await expect(page.getByText("Terminal Protocol")).toBeVisible();
    await expect(page.getByText("Irreversible Manifest Erasure")).toBeVisible();

    // Delete button should be visible - "Erase Identity"
    await expect(page.getByRole("button", { name: /erase identity/i })).toBeVisible();
  });

  test("should navigate back to dashboard", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click back link
    const backLink = page.locator("header").getByRole("link").first();
    await backLink.click();

    // Should navigate to dashboard
    await page.waitForURL("/");
  });
});

test.describe("Account Settings - Delete Account", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should open delete confirmation dialog", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click delete account button - "Erase Identity"
    await page.getByRole("button", { name: /erase identity/i }).click();

    // Dialog should open
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Delete Account" })).toBeVisible();
  });

  test("should show confirmation input in delete dialog", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Open dialog
    await page.getByRole("button", { name: /erase identity/i }).click();

    // Should show confirmation text instructions
    await expect(page.getByText(/to confirm, type.*DELETE MY ACCOUNT/i)).toBeVisible();

    // Input should be visible
    await expect(page.getByPlaceholder("DELETE MY ACCOUNT")).toBeVisible();
  });

  test("should disable delete button until confirmation typed", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Open dialog
    await page.getByRole("button", { name: /erase identity/i }).click();

    // Delete button should be disabled initially
    const deleteButton = page.getByRole("button", { name: "Delete My Account" });
    await expect(deleteButton).toBeDisabled();

    // Type wrong text
    await page.getByPlaceholder("DELETE MY ACCOUNT").fill("wrong text");
    await expect(deleteButton).toBeDisabled();

    // Type correct text
    await page.getByPlaceholder("DELETE MY ACCOUNT").fill("DELETE MY ACCOUNT");
    await expect(deleteButton).toBeEnabled();
  });

  test("should close dialog when clicking cancel", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Open dialog
    await page.getByRole("button", { name: /erase identity/i }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();

    // Click cancel
    await page.getByRole("button", { name: "Cancel" }).click();

    // Dialog should close
    await expect(page.getByRole("alertdialog")).not.toBeVisible();
  });
});

test.describe("Account Settings - Export Data", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
    await mockAPI.account(page);
  });

  test("should trigger export when clicking export button", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Set up download listener
    const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

    // Click export button - "Initiate Extraction"
    await page.getByRole("button", { name: /initiate extraction/i }).click();

    // Should either download file or show toast
    const successToast = page.getByText("Data exported");
    const download = await downloadPromise;

    // Either download happened or success toast appeared
    if (download) {
      expect(download.suggestedFilename()).toContain("account-data");
    } else {
      await expect(successToast).toBeVisible({ timeout: 5000 });
    }
  });
});
