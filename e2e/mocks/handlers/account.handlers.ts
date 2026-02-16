import { Page } from "@playwright/test";
import { mockUser, mockStreams, mockNewsletters, mockSubscription } from "../data";

/**
 * Mock account endpoints
 */
export async function mockAccountEndpoints(page: Page) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Export account data
  await page.route(`${backendUrl}/api/v1/account/data`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: mockUser,
          streams: mockStreams,
          newsletters: mockNewsletters,
          subscription: mockSubscription,
          exportedAt: new Date().toISOString(),
        }),
      });
    } else {
      await route.fallback();
    }
  });

  // Delete account
  await page.route(`${backendUrl}/api/v1/account`, async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { success: true, message: "Account deleted successfully" },
        }),
      });
    } else {
      await route.fallback();
    }
  });
}
