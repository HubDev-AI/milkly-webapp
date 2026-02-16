import { test, expect } from "../../fixtures/test.fixture";
import { mockUser } from "../../mocks/data";

test.describe("Account Settings", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should display account settings page with header", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Should show page title
    await expect(page.getByRole("heading", { name: "Account Settings" })).toBeVisible();
    await expect(page.getByText("Manage your account and data")).toBeVisible();
  });

  test("should show profile card with user information", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Profile card should be visible
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByText("Your account information")).toBeVisible();

    // User info should be shown
    await expect(page.getByText(mockUser.name)).toBeVisible();
    await expect(page.getByText(mockUser.email)).toBeVisible();
  });

  test("should show export data card", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Export card should be visible
    await expect(page.getByRole("heading", { name: "Export Your Data" })).toBeVisible();
    await expect(page.getByText("Download a copy of all your data")).toBeVisible();

    // Export button should be visible
    await expect(page.getByRole("button", { name: /export data/i })).toBeVisible();
  });

  test("should show danger zone card", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Danger zone card should be visible
    await expect(page.getByRole("heading", { name: "Danger Zone" })).toBeVisible();
    await expect(page.getByText("Irreversible actions")).toBeVisible();

    // Delete button should be visible
    await expect(page.getByRole("button", { name: /delete account/i })).toBeVisible();
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

    // Click delete account button
    await page.getByRole("button", { name: /delete account/i }).click();

    // Dialog should open
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Delete Account" })).toBeVisible();
  });

  test("should show confirmation input in delete dialog", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Open dialog
    await page.getByRole("button", { name: /delete account/i }).click();

    // Should show confirmation text instructions
    await expect(page.getByText(/to confirm, type.*delete my account/i)).toBeVisible();

    // Input should be visible (use role-based selector for textbox)
    await expect(page.getByRole("textbox", { name: "DELETE MY ACCOUNT" })).toBeVisible();
  });

  test("should disable delete button until confirmation typed", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Open dialog
    await page.getByRole("button", { name: /delete account/i }).click();

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
    await page.getByRole("button", { name: /delete account/i }).click();
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

    // Click export button
    await page.getByRole("button", { name: /export data/i }).click();

    // Should either download file or show toast (depending on browser)
    // For test purposes, we just verify the button was clickable and no errors occurred
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
