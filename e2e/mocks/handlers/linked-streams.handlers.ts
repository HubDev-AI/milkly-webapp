import { Page } from "@playwright/test";
import { mockLinkedStreams, mockFeedItems, mockTemplates, mockNewsletters, mockStreams } from "../data";

/**
 * Mock linked streams endpoints
 */
export async function mockLinkedStreamsEndpoints(page: Page) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  // List linked streams (match base URL with or without query params)
  // Using regex to match /api/v1/linked-streams, /api/v1/linked-streams?, /api/v1/linked-streams?page=1...
  await page.route(new RegExp(`${backendUrl.replace(/\./g, "\\.")}/api/v1/linked-streams(\\?|$)`), async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Skip if URL contains additional path segments (e.g., /linked-streams/123)
    const pathname = new URL(url).pathname;
    if (pathname !== "/api/v1/linked-streams") {
      await route.fallback();
      return;
    }

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockLinkedStreams,
          pagination: {
            page: 1,
            limit: 10,
            total: mockLinkedStreams.length,
            totalPages: 1,
          },
        }),
      });
    } else if (method === "POST") {
      const body = route.request().postDataJSON();
      const newLinkedStream = {
        id: `linked-stream-${Date.now()}`,
        ...body,
        userId: "test-user-id",
        streams: body.streamIds?.map((id: string) => mockStreams.find((s) => s.id === id) || mockStreams[0]) || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: newLinkedStream }),
      });
    } else {
      await route.fallback();
    }
  });

  // Get single linked stream
  await page.route(new RegExp(`${backendUrl}/api/v1/linked-streams/[^/]+$`), async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Skip template/feed/newsletter sub-routes
    if (url.includes("/templates") || url.includes("/feed") || url.includes("/newsletters")) {
      await route.fallback();
      return;
    }

    if (method === "GET") {
      const linkedStreamId = url.split("/").pop();
      const linkedStream = mockLinkedStreams.find((ls) => ls.id === linkedStreamId) || mockLinkedStreams[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: linkedStream }),
      });
    } else if (method === "PUT") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { ...mockLinkedStreams[0], ...body } }),
      });
    } else if (method === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { success: true } }),
      });
    } else {
      await route.fallback();
    }
  });

  // Linked stream feed (match any URL containing /api/v1/linked-streams/*/feed)
  await page.route(`${backendUrl}/api/v1/linked-streams/**/feed**`, async (route) => {
    if (route.request().method() === "GET") {
      // Return combined feed items from all linked streams
      const combinedItems = mockFeedItems.map((item) => ({
        ...item,
        linkedStreamId: "linked-stream-1",
        streamId: null,
      }));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: combinedItems,
          pagination: {
            page: 1,
            limit: 20,
            total: combinedItems.length,
            totalPages: 1,
          },
        }),
      });
    } else {
      await route.fallback();
    }
  });

  // Linked stream templates
  await page.route(new RegExp(`${backendUrl}/api/v1/linked-streams/[^/]+/templates`), async (route) => {
    if (route.request().method() === "GET") {
      // Return templates adapted for linked stream
      const linkedStreamTemplates = mockTemplates.map((t) => ({
        ...t,
        linkedStreamId: "linked-stream-1",
        streamId: null,
      }));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: linkedStreamTemplates }),
      });
    } else if (route.request().method() === "POST") {
      // Create new template for linked stream
      const body = route.request().postDataJSON();
      const newTemplate = {
        id: `template-${Date.now()}`,
        name: body.name || "New Template",
        linkedStreamId: "linked-stream-1",
        streamId: null,
        isActive: false,
        mklySource: mockTemplates[0].mklySource,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: newTemplate }),
      });
    } else {
      await route.fallback();
    }
  });

  // Linked stream newsletters
  await page.route(new RegExp(`${backendUrl}/api/v1/linked-streams/[^/]+/newsletters`), async (route) => {
    if (route.request().method() === "GET") {
      // Return newsletters adapted for linked stream
      const linkedStreamNewsletters = mockNewsletters.map((n) => ({
        ...n,
        linkedStreamId: "linked-stream-1",
        streamId: null,
      }));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: linkedStreamNewsletters }),
      });
    } else if (route.request().method() === "POST") {
      // Create new newsletter for linked stream
      const newNewsletter = {
        id: `newsletter-${Date.now()}`,
        title: "New Linked Stream Newsletter",
        content: "",
        status: "draft",
        linkedStreamId: "linked-stream-1",
        streamId: null,
        templateId: mockTemplates[0].id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
      };

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: newNewsletter }),
      });
    } else {
      await route.fallback();
    }
  });

  // Linked stream custom items
  await page.route(new RegExp(`${backendUrl}/api/v1/linked-streams/[^/]+/custom-items`), async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    } else if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      const newItem = {
        id: `custom-item-${Date.now()}`,
        ...body,
        linkedStreamId: "linked-stream-1",
        isCustomItem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: newItem }),
      });
    } else {
      await route.fallback();
    }
  });

  // Linked stream milk (refresh)
  await page.route(new RegExp(`${backendUrl}/api/v1/linked-streams/[^/]+/milk`), async (route) => {
    if (route.request().method() === "POST") {
      await new Promise((resolve) => setTimeout(resolve, 500));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            success: true,
            newItemsCount: 5,
            message: "Feed refreshed successfully",
          },
        }),
      });
    } else {
      await route.fallback();
    }
  });
}
