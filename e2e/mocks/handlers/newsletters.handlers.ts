import { Page } from "@playwright/test";
import { mockNewsletters, mockGeneratedContent } from "../data";

/**
 * Mock newsletter endpoints
 */
export async function mockNewslettersEndpoints(page: Page) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  // List newsletters for stream
  await page.route(new RegExp(`${backendUrl}/api/v1/streams/[^/]+/newsletters`), async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockNewsletters,
          pagination: {
            page: 1,
            limit: 10,
            total: mockNewsletters.length,
            totalPages: 1,
          },
        }),
      });
    } else if (route.request().method() === "POST") {
      // Create newsletter
      const body = route.request().postDataJSON();
      const newNewsletter = {
        id: `newsletter-${Date.now()}`,
        title: body.title || "Untitled Newsletter",
        content: "",
        status: "draft",
        streamId: body.streamId,
        linkedStreamId: null,
        streamName: "Tech News",
        templateId: body.templateId || null,
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

  // Get/Update/Delete single newsletter
  await page.route(new RegExp(`${backendUrl}/api/v1/newsletters/[^/]+$`), async (route) => {
    const url = route.request().url();
    const newsletterId = url.split("/").pop();
    const method = route.request().method();

    if (method === "GET") {
      const newsletter = mockNewsletters.find((n) => n.id === newsletterId) || mockNewsletters[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: newsletter }),
      });
    } else if (method === "PUT") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { ...mockNewsletters[0], ...body, updatedAt: new Date().toISOString() },
        }),
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

  // Newsletter preview (AI generation)
  await page.route(`${backendUrl}/api/v1/newsletters/preview`, async (route) => {
    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: mockGeneratedContent,
      }),
    });
  });

  // Regenerate newsletter content
  await page.route(new RegExp(`${backendUrl}/api/v1/newsletters/[^/]+/regenerate`), async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          content: mockGeneratedContent.html,
          title: mockGeneratedContent.title,
        },
      }),
    });
  });

  // Publish newsletter
  await page.route(new RegExp(`${backendUrl}/api/v1/newsletters/[^/]+/publish`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          ...mockNewsletters[0],
          status: "published",
          publishedAt: new Date().toISOString(),
        },
      }),
    });
  });

  // Generate notes for items
  await page.route(new RegExp(`${backendUrl}/api/v1/newsletters/[^/]+/generate-notes`), async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          notes: {
            "item-1": "This article explores how AI is revolutionizing software development workflows.",
            "item-2": "A comprehensive guide to the new features in React 19.",
          },
        },
      }),
    });
  });

  // Generate notes from items (batch)
  await page.route(`${backendUrl}/api/v1/newsletters/generate-notes-from-items`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          notes: {
            "item-1": "Key insights about AI in software development.",
            "item-2": "React 19 brings significant performance improvements.",
          },
        },
      }),
    });
  });
}
