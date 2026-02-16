import { Page } from "@playwright/test";
import { mockStreams } from "../data";

/**
 * Mock streams CRUD endpoints
 */
export async function mockStreamsEndpoints(page: Page) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  // List streams
  await page.route(`${backendUrl}/api/v1/streams?*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: mockStreams,
        pagination: {
          page: 1,
          limit: 10,
          total: mockStreams.length,
          totalPages: 1,
        },
      }),
    });
  });

  // Get single stream
  await page.route(new RegExp(`${backendUrl}/api/v1/streams/[^/]+$`), async (route) => {
    if (route.request().method() === "GET") {
      const url = route.request().url();
      const streamId = url.split("/").pop();
      const stream = mockStreams.find((s) => s.id === streamId) || mockStreams[0];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: stream }),
      });
    } else if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { ...mockStreams[0], ...body } }),
      });
    } else if (route.request().method() === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { success: true } }),
      });
    } else {
      await route.fallback();
    }
  });

  // Create stream (POST only, exact path)
  await page.route(new RegExp(`^${backendUrl}/api/v1/streams$`), async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      const newStream = {
        id: `stream-${Date.now()}`,
        ...body,
        userId: "test-user-id",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMilkedAt: null,
      };
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: newStream }),
      });
    } else {
      await route.fallback();
    }
  });

  // Available categories
  await page.route(`${backendUrl}/api/v1/streams/available-categories`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: ["news", "videos", "social", "custom"],
      }),
    });
  });

  // Generate keywords
  await page.route(`${backendUrl}/api/v1/streams/generate-keywords`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          keywords: ["technology", "software", "programming", "AI", "web development"],
        },
      }),
    });
  });
}
