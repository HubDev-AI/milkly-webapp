import { Page } from "@playwright/test";
import { mockFeedItems } from "../data";

/**
 * Mock feed endpoints (content items, refresh)
 */
export async function mockFeedEndpoints(page: Page) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Get stream feed (must match URLs with query params like /feed?category=news&...)
  await page.route(new RegExp(`${backendUrl}/api/v1/streams/[^/]+/feed(\\?.*)?$`), async (route) => {
    const url = new URL(route.request().url());
    const category = url.searchParams.get("category");
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    let items = [...mockFeedItems];

    // Filter by category
    if (category && category !== "all") {
      items = items.filter((item) => item.category === category);
    }

    // Response format expected by PaginatedResponseSchema after api client unwraps { data: ... }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          items,
          total: items.length,
          limit,
          offset,
          hasMore: false,
          latestBatchId: "batch-1",
        },
      }),
    });
  });

  // Check if stream has custom items
  await page.route(new RegExp(`${backendUrl}/api/v1/streams/[^/]+/feed/custom-check`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { hasCustomItems: true },
      }),
    });
  });

  // Refresh stream (milk) - returns refreshed count and batchId
  await page.route(new RegExp(`${backendUrl}/api/v1/streams/[^/]+/refresh`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          refreshed: 5,
          batchId: `batch-${Date.now()}`,
        },
      }),
    });
  });

  // Create custom item
  await page.route(new RegExp(`${backendUrl}/api/v1/streams/[^/]+/content-items$`), async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      const newItem = {
        id: `item-${Date.now()}`,
        ...body,
        isCustomItem: true,
        isEdited: false,
        createdAt: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        batchId: null,
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

  // Update/Delete content item
  await page.route(new RegExp(`${backendUrl}/api/v1/streams/[^/]+/content-items/[^/]+$`), async (route) => {
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { ...mockFeedItems[0], ...body, isEdited: true } }),
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

  // Bulk delete
  await page.route(new RegExp(`${backendUrl}/api/v1/streams/[^/]+/content-items/bulk`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { deleted: 2, skipped: 0 } }),
    });
  });
}
