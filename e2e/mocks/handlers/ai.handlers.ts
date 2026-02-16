import { Page } from "@playwright/test";
import { mockGeneratedContent } from "../data";

/**
 * Mock AI-related endpoints (Google Gemini, content generation)
 *
 * These endpoints are critical to mock because:
 * 1. They call external AI services (expensive, slow, non-deterministic)
 * 2. Tests need predictable responses
 * 3. Rate limits on AI APIs
 */
export async function mockAIEndpoints(page: Page) {
  const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:3000";

  // AI status check
  await page.route(`${backendUrl}/api/v1/ai/status`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          available: true,
          provider: "gemini",
          model: "gemini-pro",
        },
      }),
    });
  });

  // Generate content from prompt
  await page.route(`${backendUrl}/api/v1/ai/generate`, async (route) => {
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    const body = route.request().postDataJSON();
    const prompt = body?.prompt || "";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          content: `<div><h1>Generated Content</h1><p>Based on your prompt: "${prompt.substring(0, 50)}..."</p><p>${mockGeneratedContent.html}</p></div>`,
        },
      }),
    });
  });

  // Generate keywords for stream
  await page.route(`${backendUrl}/api/v1/streams/generate-keywords`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          keywords: [
            "artificial intelligence",
            "machine learning",
            "software development",
            "web technologies",
            "cloud computing",
          ],
        },
      }),
    });
  });

  // Newsletter preview generation
  await page.route(`${backendUrl}/api/v1/newsletters/preview`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: mockGeneratedContent,
      }),
    });
  });

  // Newsletter regeneration
  await page.route(new RegExp(`${backendUrl}/api/v1/newsletters/[^/]+/regenerate`), async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          content: mockGeneratedContent.html,
          title: "Regenerated: " + mockGeneratedContent.title,
        },
      }),
    });
  });

  // Generate notes for newsletter items
  await page.route(new RegExp(`${backendUrl}/api/v1/newsletters/[^/]+/generate-notes`), async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          notes: {
            "item-1": "AI-generated summary: This article discusses the transformative impact of artificial intelligence on modern software development practices.",
            "item-2": "AI-generated summary: An in-depth look at React 19's new features including improved concurrent rendering and automatic batching.",
          },
        },
      }),
    });
  });

  // Batch generate notes from items
  await page.route(`${backendUrl}/api/v1/newsletters/generate-notes-from-items`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const body = route.request().postDataJSON();
    const itemIds = body?.contentItemIds || [];

    const notes: Record<string, string> = {};
    itemIds.forEach((id: string, index: number) => {
      notes[id] = `AI-generated note for item ${index + 1}: A concise summary of the key points.`;
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { notes } }),
    });
  });

  // Template AI generation (POST to /api/v1/streams/:id/templates)
  // Use fallback() for non-POST to let other handlers (templates.handlers.ts) handle GET requests
  await page.route(new RegExp(`${backendUrl}/api/v1/streams/[^/]+/templates$`), async (route) => {
    if (route.request().method() === "POST") {
      await new Promise((resolve) => setTimeout(resolve, 500));

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: `template-ai-${Date.now()}`,
            name: "AI-Generated Template",
            streamId: "stream-1",
            linkedStreamId: null,
            isActive: false,
            mklySource: `--- meta\ntitle: AI-Generated Template\n\n--- use: newsletter\n\n--- style\nprimary: #1e40af\naccent: #7c3aed\ntone: professional\n\n--- newsletter/category\nheading: Top Stories\ncategory: news\nmaxItems: 5\nstyle: detailed\n\n--- newsletter/category\nheading: Watch Now\ncategory: videos\nmaxItems: 3\nstyle: compact\n\n--- newsletter/category\nheading: Social Buzz\ncategory: social\nmaxItems: 4\nstyle: minimal`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });
    } else {
      await route.fallback();
    }
  });

  // Template preview (AI)
  await page.route(`${backendUrl}/api/v1/templates/preview`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          html: `
            <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1e40af;">Template Preview</h1>
              <section style="margin: 20px 0;">
                <h2>Top Stories</h2>
                <p>Preview of news items would appear here...</p>
              </section>
              <section style="margin: 20px 0;">
                <h2>Watch Now</h2>
                <p>Preview of video items would appear here...</p>
              </section>
            </div>
          `,
        },
      }),
    });
  });
}
