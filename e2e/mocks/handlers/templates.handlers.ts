import { Page } from "@playwright/test";
import { mockTemplates, mockStreams } from "../data";

/**
 * Mock template endpoints
 * IMPORTANT: Global templates list route MUST be registered FIRST
 * so it doesn't get intercepted by more specific routes
 */
export async function mockTemplatesEndpoints(page: Page) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  // ============= GLOBAL TEMPLATES LIST (MUST BE FIRST) =============
  // Transform mockTemplates to include required TemplateWithStream fields
  const templatesWithStreamInfo = mockTemplates.map((template) => {
    const stream = mockStreams.find((s) => s.id === template.streamId);
    return {
      id: template.id,
      name: template.name,
      isActive: template.isActive,
      mklySource: template.mklySource,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      streamType: template.linkedStreamId ? "linkedStream" : "stream",
      streamId: template.streamId,
      streamName: stream?.name || null,
    };
  });

  const globalTemplatesHandler = async (route: any) => {
    const method = route.request().method();

    if (method !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: templatesWithStreamInfo,
        pagination: { page: 1, limit: 20, total: templatesWithStreamInfo.length, totalPages: 1 },
      }),
    });
  };

  // Register global templates routes FIRST with multiple patterns
  await page.route(`${backendUrl}/api/v1/templates`, globalTemplatesHandler);
  await page.route(`${backendUrl}/api/v1/templates?*`, globalTemplatesHandler);
  await page.route(`**/api/v1/templates`, globalTemplatesHandler);
  await page.route(`**/api/v1/templates?*`, globalTemplatesHandler);

  // ============= SPECIFIC TEMPLATE ROUTES (registered after) =============

  // Template preview (AI)
  await page.route(`${backendUrl}/api/v1/templates/preview`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { html: "<div><h1>Template Preview</h1><p>Preview content...</p></div>" },
      }),
    });
  });

  // Activate template
  await page.route(new RegExp(`${backendUrl}/api/v1/templates/[^/]+/activate`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { ...mockTemplates[0], isActive: true } }),
    });
  });

  // Deactivate template
  await page.route(new RegExp(`${backendUrl}/api/v1/templates/[^/]+/deactivate`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { ...mockTemplates[0], isActive: false } }),
    });
  });

  // Duplicate template
  await page.route(new RegExp(`${backendUrl}/api/v1/templates/[^/]+/duplicate`), async (route) => {
    const duplicated = {
      ...mockTemplates[0],
      id: `template-${Date.now()}`,
      name: `${mockTemplates[0].name} (Copy)`,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: duplicated }),
    });
  });

  // Get/Update/Delete single template
  await page.route(new RegExp(`${backendUrl}/api/v1/templates/[^/]+$`), async (route) => {
    const url = route.request().url();
    if (url.includes("/preview") || url.includes("/activate") || url.includes("/deactivate") || url.includes("/duplicate")) {
      await route.fallback();
      return;
    }

    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: mockTemplates[0] }),
      });
    } else if (method === "PUT") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { ...mockTemplates[0], ...body, updatedAt: new Date().toISOString() } }),
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

  // List templates for stream
  await page.route(new RegExp(`${backendUrl}/api/v1/streams/[^/]+/templates(\\?.*)?$`), async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: mockTemplates }),
      });
    } else if (route.request().method() === "POST") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newTemplate = {
        id: `template-${Date.now()}`,
        name: "AI Generated Template",
        streamId: "stream-1",
        linkedStreamId: null,
        isActive: false,
        mklySource: `--- meta\ntitle: AI Generated Template\n\n--- use: newsletter\n\n--- style\nprimary: #2563eb\naccent: #64748b\ntone: professional\n\n--- newsletter/category\nheading: Latest News\ncategory: news\nmaxItems: 5\nstyle: detailed`,
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
}
