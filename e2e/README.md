# E2E Testing

## Commands

```bash
bun run test:e2e          # Run all tests
bun run test:e2e:ui       # Interactive UI mode
bun run test:e2e:record   # Record tests by clicking in browser
bun run test:e2e:headed   # Run with visible browser
bun run test:e2e:debug    # Debug mode
bun run test:e2e:report   # View HTML report
```

## Recording Tests

```bash
# Start dev servers first, then:
bun run test:e2e:record
```

Click around in the browser → code appears in Playwright Inspector → copy into test file.

## Writing Tests

```typescript
import { test, expect } from "../../fixtures/test.fixture";

test.describe("Feature", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("does something", async ({ page }) => {
    await page.goto("/page");
    await page.click("button:has-text('Action')");
    await expect(page.getByText("Result")).toBeVisible();
  });
});
```

## Mocking AI Responses

AI endpoints are mocked in `e2e/mocks/handlers/ai.handlers.ts`. Override for specific tests:

```typescript
await page.route("**/api/newsletters/preview", async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ data: { html: "<h1>Custom</h1>" } }),
  });
});
```

## Adding Mock Handlers

1. Create handler in `e2e/mocks/handlers/`
2. Export from `e2e/mocks/handlers/index.ts`
3. Add to `mockAPI.all()` in `e2e/fixtures/test.fixture.ts`

## API Response Format

```typescript
{ data: { ... } }                    // Success
{ error: { message: "...", code: "..." } }  // Error
{ data: [...], pagination: { ... } }        // Paginated
```
