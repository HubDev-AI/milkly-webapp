import { test, expect } from "../../fixtures/test.fixture";

test.describe("Subscription Page", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should display subscription page with header", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Should show page title
    await expect(page.getByRole("heading", { name: "Subscription" })).toBeVisible();
    await expect(page.getByText("Manage your plan and usage")).toBeVisible();
  });

  test("should show current plan card", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Current plan card should be visible - Professional tier from mock
    await expect(page.getByRole("heading", { name: "Professional" })).toBeVisible();
    await expect(page.getByText("Current plan", { exact: true })).toBeVisible();
  });

  test("should show active status badge", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Active status badge should be visible (it's in the current plan card)
    const planCard = page.locator("[class*=card]").filter({ hasText: "Current plan" }).first();
    await expect(planCard.getByText("Active")).toBeVisible();
  });

  test("displays subscription page with current plan and usage sections", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Verify current plan card is visible
    await expect(page.getByRole("heading", { name: "Professional" })).toBeVisible();
    await expect(page.getByText("Current plan", { exact: true })).toBeVisible();

    // Verify usage card is visible with correct sections
    await expect(page.getByText("Usage This Month")).toBeVisible();
    await expect(page.getByText("Streams", { exact: true })).toBeVisible();
    await expect(page.getByText("Refreshes", { exact: true })).toBeVisible();
    await expect(page.getByText("AI Credits", { exact: true })).toBeVisible();

    // Verify 'Manage Subscription' button is visible for paid users (Professional tier)
    await expect(page.getByRole("button", { name: /manage subscription/i })).toBeVisible();
  });

  test("should show included features", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Features card should be visible
    await expect(page.getByText("Included Features")).toBeVisible();
    await expect(page.getByText("What you get with your current plan")).toBeVisible();
  });

  test("should show upgrade/change plan button", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Change plan button should be visible (user is on Professional)
    const changePlanButton = page.getByRole("link", { name: /change plan|upgrade plan/i });
    await expect(changePlanButton).toBeVisible();
  });

  test("should show manage billing button for paid tier", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Manage subscription button should be visible for Professional tier
    await expect(page.getByRole("button", { name: /manage subscription/i })).toBeVisible();
  });

  test("should navigate back to dashboard", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Click back link
    const backLink = page.locator("header").getByRole("link").first();
    await backLink.click();

    // Should navigate to dashboard
    await page.waitForURL("/");
  });

  test("should navigate to pricing page when clicking change plan", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Click change plan link
    const changePlanLink = page.getByRole("link", { name: /change plan|upgrade plan/i });
    await changePlanLink.click();

    // Should navigate to pricing
    await page.waitForURL("/pricing");
  });
});

test.describe("Subscription Page - Usage Limits from Snapshot", () => {
  test("displays usage limits from snapshot", async ({ page, mockAPI }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";
    const snapshotDate = new Date().toISOString();

    // Mock subscription endpoint with snapshotted limits
    await page.route(`${backendUrl}/api/subscription`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              subscription: {
                id: "sub_123",
                tier: "professional",
                status: "active",
                currentPeriodStart: new Date().toISOString(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancelAtPeriodEnd: false,
              },
              usage: {
                refreshesUsed: 15,
                aiCreditsUsed: 50,
                streamCount: 3,
                periodStart: new Date().toISOString(),
                periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
              limits: {
                maxStreams: 10,
                aiCredits: 300,
                refreshes: 100,
                linkedStreams: true,
              },
              features: ["10 streams", "300 AI credits/month", "Linked streams"],
              snapshotedAt: snapshotDate,
              fromSnapshot: true,
              freeTierStatus: {
                periodExpired: false,
                canRenew: true,
                active: true,
                message: null,
              },
            },
          }),
        });
      } else {
        await route.fallback();
      }
    });

    // Mock other required endpoints
    await mockAPI.auth(page);
    await mockAPI.streams(page);
    await mockAPI.linkedStreams(page);

    // Mock dev-status endpoint
    await page.route(`${backendUrl}/api/subscription/dev-status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { devMode: false, stripeConfigured: true } }),
      });
    });

    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Verify usage card displays the snapshotted limits correctly
    await expect(page.getByText("Usage This Month")).toBeVisible();
    await expect(page.getByText("3 / 10")).toBeVisible(); // Streams
    await expect(page.getByText("15 / 100")).toBeVisible(); // Refreshes
    await expect(page.getByText("50 / 300")).toBeVisible(); // AI Credits
  });
});

test.describe("Subscription Page - Essential Tier Expired", () => {
  test("shows expired banner when essential tier expired and cannot renew", async ({ page, mockAPI }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

    // Mock subscription endpoint with expired essential tier
    await page.route(`${backendUrl}/api/subscription`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              subscription: {
                id: "sub_free_expired",
                tier: "essential",
                status: "active",
                currentPeriodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                currentPeriodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancelAtPeriodEnd: false,
              },
              usage: {
                refreshesUsed: 0,
                aiCreditsUsed: 0,
                streamCount: 1,
                periodStart: new Date().toISOString(),
                periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
              limits: {
                maxStreams: 1,
                aiCredits: 120,
                refreshes: 30,
                linkedStreams: false,
              },
              features: ["1 stream", "120 AI credits / month"],
              snapshotedAt: null,
              fromSnapshot: false,
              freeTierStatus: {
                periodExpired: true,
                canRenew: false,
                active: false,
                message: "Your essential plan has expired and is no longer available. Please upgrade to continue using Milkly.",
              },
            },
          }),
        });
      } else {
        await route.fallback();
      }
    });

    // Mock other required endpoints
    await mockAPI.auth(page);
    await mockAPI.streams(page);
    await mockAPI.linkedStreams(page);

    // Mock dev-status endpoint
    await page.route(`${backendUrl}/api/subscription/dev-status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { devMode: false, stripeConfigured: true } }),
      });
    });

    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Verify "Essential Plan Expired" alert/banner is visible
    await expect(page.getByText("Essential Plan Expired")).toBeVisible();
    await expect(page.getByText(/Your essential plan has expired/)).toBeVisible();

    // Verify "Upgrade Now" button is visible
    await expect(page.getByRole("button", { name: "Upgrade Now" })).toBeVisible();

    // Verify usage card is disabled/hidden (shows different content when freeTierStatus.active is false)
    await expect(page.getByText("Upgrade to a paid plan to view and track your usage")).toBeVisible();
  });
});

test.describe("Subscription Page - Dev Mode", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should show dev mode tier switcher when enabled", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Dev mode section should be visible (mock has devMode: true)
    await expect(page.getByText("Dev Mode")).toBeVisible();
    await expect(page.getByText("Testing Only")).toBeVisible();
  });

  test("should show tier buttons in dev mode", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // All tier buttons should be visible
    await expect(page.getByRole("button", { name: /essential/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /professional/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /mastery/i })).toBeVisible();
  });

  test("allows tier switching in dev mode", async ({ page }) => {
    const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";
    let tierSwitchRequested = false;
    let requestedTier: string | null = null;

    // Intercept the dev-switch endpoint to verify the request
    await page.route(`${backendUrl}/api/subscription/dev-switch`, async (route) => {
      const body = route.request().postDataJSON();
      tierSwitchRequested = true;
      requestedTier = body?.tier;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            message: `Switched to ${body?.tier} tier`,
          },
        }),
      });
    });

    await page.goto("/subscription");
    await page.waitForLoadState("networkidle");

    // Verify dev mode tier switcher is visible
    await expect(page.getByText("Dev Mode")).toBeVisible();
    await expect(page.getByText("Testing Only")).toBeVisible();

    // Find the Essential button (which should not be the current tier since mock is Professional)
    const essentialButton = page.locator("button").filter({ hasText: /^Essential$/ });
    await expect(essentialButton).toBeVisible();

    // Click on "Essential" tier button
    await essentialButton.click();

    // Wait for the request to be made
    await page.waitForTimeout(500);

    // Verify the tier change request was made
    expect(tierSwitchRequested).toBe(true);
    expect(requestedTier).toBe("essential");
  });
});
