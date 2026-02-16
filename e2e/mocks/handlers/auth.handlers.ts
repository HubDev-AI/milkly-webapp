import { Page } from "@playwright/test";
import { mockUser, mockSession } from "../data";

/**
 * Mock authentication endpoints
 * Better Auth uses /api/v1/auth/* routes
 */
export async function mockAuthEndpoints(page: Page) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Mock send OTP
  await page.route(`${backendUrl}/api/v1/auth/email-otp/send-verification-otp`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  // Mock verify OTP
  await page.route(`${backendUrl}/api/v1/auth/email-otp/verify-email`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: mockUser,
        session: mockSession,
      }),
    });
  });

  // Mock get session
  await page.route(`${backendUrl}/api/v1/auth/get-session`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: mockUser,
        session: mockSession,
      }),
    });
  });

  // Mock sign out
  await page.route(`${backendUrl}/api/v1/auth/sign-out`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

/**
 * Mock unauthenticated session (for testing login flows)
 */
export async function mockUnauthenticatedSession(page: Page) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  await page.route(`${backendUrl}/api/v1/auth/get-session`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: null, session: null }),
    });
  });
}
