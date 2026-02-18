import { test, expect } from "@playwright/test";
import { mockUnauthenticatedSession } from "../../mocks/handlers/auth.handlers";

test.describe("Login Flow", () => {
  test("should display login page for unauthenticated users", async ({ page }) => {
    await mockUnauthenticatedSession(page);
    await page.goto("/login");

    await expect(page.getByText("Milkly")).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /enter workspace/i })).toBeVisible();
  });

  test("should show validation error for empty email", async ({ page }) => {
    await mockUnauthenticatedSession(page);
    await page.goto("/login");

    await page.getByRole("button", { name: /enter workspace/i }).click();

    await expect(page.getByText("Email required", { exact: true })).toBeVisible();
  });

  test("should send OTP and redirect to verify page", async ({ page }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

    // Start with unauthenticated
    await mockUnauthenticatedSession(page);

    // Mock the OTP send endpoint
    await page.route(`${backendUrl}/api/v1/auth/email-otp/send-verification-otp`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/login");

    await page.getByLabel(/email address/i).fill("test@example.com");
    await page.getByRole("button", { name: /enter workspace/i }).click();

    await page.waitForURL("/verify-otp");
    await expect(page).toHaveURL("/verify-otp");
  });

  test("should show OTP verification page after email submission", async ({ page }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

    await mockUnauthenticatedSession(page);

    await page.route(`${backendUrl}/api/v1/auth/email-otp/send-verification-otp`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/login");
    await page.getByLabel(/email address/i).fill("test@example.com");
    await page.getByRole("button", { name: /enter workspace/i }).click();
    await page.waitForURL("/verify-otp");

    // Verify OTP page elements
    await expect(page.getByText("Check your email")).toBeVisible();
    await expect(page.getByText("test@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "Verify Code" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Resend Code" })).toBeVisible();
  });
});

test.describe("Protected Routes", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    await mockUnauthenticatedSession(page);

    await page.goto("/streams/123");

    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});
