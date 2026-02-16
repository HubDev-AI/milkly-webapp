/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, Page, BrowserContext } from "@playwright/test";
import { mockAuthEndpoints } from "../mocks/handlers/auth.handlers";
import { mockStreamsEndpoints } from "../mocks/handlers/streams.handlers";
import { mockLinkedStreamsEndpoints } from "../mocks/handlers/linked-streams.handlers";
import { mockFeedEndpoints } from "../mocks/handlers/feed.handlers";
import { mockNewslettersEndpoints } from "../mocks/handlers/newsletters.handlers";
import { mockTemplatesEndpoints } from "../mocks/handlers/templates.handlers";
import { mockAIEndpoints } from "../mocks/handlers/ai.handlers";
import { mockSubscriptionEndpoints } from "../mocks/handlers/subscription.handlers";
import { mockAccountEndpoints } from "../mocks/handlers/account.handlers";

/**
 * Extended test fixture with authentication and API mocking helpers
 */
export interface TestFixtures {
  authenticatedPage: Page;
  mockAPI: {
    auth: typeof mockAuthEndpoints;
    streams: typeof mockStreamsEndpoints;
    linkedStreams: typeof mockLinkedStreamsEndpoints;
    feed: typeof mockFeedEndpoints;
    newsletters: typeof mockNewslettersEndpoints;
    templates: typeof mockTemplatesEndpoints;
    ai: typeof mockAIEndpoints;
    subscription: typeof mockSubscriptionEndpoints;
    account: typeof mockAccountEndpoints;
    all: (page: Page) => Promise<void>;
  };
}

export const test = base.extend<TestFixtures>({
  /**
   * A page that is already authenticated
   */
  authenticatedPage: async ({ page, context }, use) => {
    // Set up authentication cookies/storage
    await setupAuthenticatedSession(context);

    // Navigate to home to verify auth
    await page.goto("/");
    await page.waitForURL("/");

    await use(page);
  },

  /**
   * API mocking utilities
   */
  // eslint-disable-next-line no-empty-pattern
  mockAPI: async ({}, use) => {
    const mockAll = async (page: Page) => {
      await mockAuthEndpoints(page);
      await mockStreamsEndpoints(page);
      await mockLinkedStreamsEndpoints(page);
      await mockFeedEndpoints(page);
      await mockNewslettersEndpoints(page);
      await mockTemplatesEndpoints(page);
      await mockAIEndpoints(page);
      await mockSubscriptionEndpoints(page);
      await mockAccountEndpoints(page);
    };

    await use({
      auth: mockAuthEndpoints,
      streams: mockStreamsEndpoints,
      linkedStreams: mockLinkedStreamsEndpoints,
      feed: mockFeedEndpoints,
      newsletters: mockNewslettersEndpoints,
      templates: mockTemplatesEndpoints,
      ai: mockAIEndpoints,
      subscription: mockSubscriptionEndpoints,
      account: mockAccountEndpoints,
      all: mockAll,
    });
  },
});

/**
 * Set up an authenticated session by adding auth cookies
 */
async function setupAuthenticatedSession(context: BrowserContext) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Add session cookie for Better Auth
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: "test-session-token-e2e",
      domain: new URL(backendUrl).hostname,
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

export { expect };
