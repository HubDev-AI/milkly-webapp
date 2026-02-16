import { Page } from "@playwright/test";
import { mockSubscription } from "../data";

/**
 * Mock subscription/payment endpoints
 */
export async function mockSubscriptionEndpoints(page: Page) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Get current subscription
  await page.route(`${backendUrl}/api/v1/subscription`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: mockSubscription }),
      });
    } else {
      await route.fallback();
    }
  });

  // Get subscription plans (matches Plan interface in Pricing.tsx)
  await page.route(`${backendUrl}/api/v1/subscription/plans`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            tier: "essential",
            name: "Essential",
            description: "Get started with basic features",
            limits: {
              maxStreams: 1,
              maxTemplatesPerStream: 1,
              milkPerWeek: 10,
              generatesPerWeek: 5,
              publishPerWeek: 2,
              linkedStreams: false,
            },
            features: ["1 stream", "120 AI credits/month", "100 email subscribers"],
            pricing: { monthly: 0, yearly: 0 },
          },
          {
            tier: "professional",
            name: "Professional",
            description: "For serious newsletter creators",
            limits: {
              maxStreams: 10,
              maxTemplatesPerStream: 5,
              milkPerWeek: 100,
              generatesPerWeek: 50,
              publishPerWeek: 20,
              linkedStreams: true,
            },
            features: ["10 streams", "1,200 AI credits/month", "1,000 email subscribers", "Linked streams"],
            pricing: { monthly: 19, yearly: 156 },
          },
          {
            tier: "mastery",
            name: "Mastery",
            description: "Unlimited power for creators",
            limits: {
              maxStreams: 50,
              maxTemplatesPerStream: -1,
              milkPerWeek: -1,
              generatesPerWeek: -1,
              publishPerWeek: -1,
              linkedStreams: true,
            },
            features: ["50 streams", "2,500 AI credits/month", "100,000 subscribers", "Priority support"],
            pricing: { monthly: 49, yearly: 396 },
          },
        ],
      }),
    });
  });

  // Public tier config (used by Pricing page for feature lists)
  await page.route(`${backendUrl}/api/v1/public/tier-config`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          essential: ["1 stream", "120 AI credits/month", "100 email subscribers", "News & Videos categories"],
          professional: ["10 streams", "1,200 AI credits/month", "1,000 email subscribers", "All categories", "Linked streams"],
          mastery: ["50 streams", "2,500 AI credits/month", "100,000 subscribers", "All features", "Priority support"],
        },
      }),
    });
  });

  // Create checkout session (Stripe)
  await page.route(`${backendUrl}/api/v1/subscription/checkout`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          url: "https://checkout.stripe.com/mock-session",
          sessionId: "mock-session-id",
        },
      }),
    });
  });

  // Create billing portal session
  await page.route(`${backendUrl}/api/v1/subscription/portal`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          url: "https://billing.stripe.com/mock-portal",
        },
      }),
    });
  });

  // Dev mode: switch tier (for testing tier-based features)
  await page.route(`${backendUrl}/api/v1/subscription/dev-switch`, async (route) => {
    const body = route.request().postDataJSON();
    const newTier = body?.tier || "professional";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          ...mockSubscription,
          subscription: {
            ...mockSubscription.subscription,
            tier: newTier,
          },
        },
      }),
    });
  });

  // Dev status
  await page.route(`${backendUrl}/api/v1/subscription/dev-status`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          devMode: true,
          canSwitchTier: true,
        },
      }),
    });
  });
}

/**
 * Mock essential tier subscription (for testing tier restrictions)
 */
export async function mockEssentialTierSubscription(page: Page) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  await page.route(`${backendUrl}/api/v1/subscription`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            subscription: {
              id: "sub-essential",
              tier: "essential",
              status: "active",
              currentPeriodStart: new Date().toISOString(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            usage: {
              milkCount: 3,
              generateCount: 1,
              publishCount: 1,
              emailCount: 0,
              streamCount: 1,
              periodStart: new Date().toISOString(),
              periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            limits: {
              maxStreams: 1,
              maxTemplatesPerStream: 1,
              milkPerWeek: 5,
              generatesPerWeek: 2,
              publishPerWeek: 1,
              emailsPerWeek: 10,
              maxEmailSubscribers: 100,
              maxNewsletterItems: 10,
              linkedStreams: false,
              allowCustomItems: true,
            },
            features: [],
          },
        }),
      });
    } else {
      await route.fallback();
    }
  });
}
