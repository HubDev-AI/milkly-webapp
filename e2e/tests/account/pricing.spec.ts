import { test, expect } from "../../fixtures/test.fixture";

test.describe("Pricing Page", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should display pricing page with header", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Should show page title
    await expect(page.getByRole("heading", { name: "Choose Your Plan" })).toBeVisible();
    await expect(page.getByText(/start free and scale as you grow/i)).toBeVisible();
  });

  test("should show billing toggle", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Billing toggle should be visible
    await expect(page.getByText("Monthly", { exact: true })).toBeVisible();
    await expect(page.getByText("Yearly", { exact: true })).toBeVisible();
    await expect(page.getByRole("switch", { name: /toggle yearly billing/i })).toBeVisible();
  });

  test("should show save badge for yearly billing", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Save badge should be visible when yearly is selected
    await expect(page.getByText(/save up to 30%/i)).toBeVisible();
  });

  test("should show all three pricing cards", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // All three plans should be visible
    await expect(page.getByRole("heading", { name: "Essential" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Professional" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mastery" })).toBeVisible();
  });

  test("should show most popular badge on Professional plan", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Most popular badge should be visible
    await expect(page.getByText("Most Popular")).toBeVisible();
  });

  test("should show current plan badge for current tier", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Current badge should be visible on Professional (user's current plan)
    await expect(page.getByText("Current", { exact: true })).toBeVisible();
  });

  test("should show feature lists for each plan", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Some common features should be visible across plans
    await expect(page.getByText(/streams/i).first()).toBeVisible();
    await expect(page.getByText(/ai credits/i).first()).toBeVisible();
  });

  test("should show all plans include section", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // All plans include section
    await expect(page.getByRole("heading", { name: "All plans include" })).toBeVisible();
    await expect(page.getByText("Content aggregation", { exact: true })).toBeVisible();
    await expect(page.getByText("AI-powered writing", { exact: true })).toBeVisible();
    await expect(page.getByText("Custom templates", { exact: true })).toBeVisible();
    await expect(page.getByText("Email delivery", { exact: true })).toBeVisible();
  });

  test("should navigate back to dashboard", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Click back link
    const backLink = page.locator("header").getByRole("link").first();
    await backLink.click();

    // Should navigate to dashboard
    await page.waitForURL("/");
  });
});

test.describe("Pricing Page - Billing Toggle", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should toggle between monthly and yearly", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Initially yearly is selected
    const toggle = page.getByRole("switch", { name: /toggle yearly billing/i });
    await expect(toggle).toBeChecked();

    // Toggle to monthly
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    // Save badge should not be visible for monthly
    await expect(page.getByText(/save up to 30%/i)).not.toBeVisible();

    // Toggle back to yearly
    await toggle.click();
    await expect(toggle).toBeChecked();

    // Save badge should be visible again
    await expect(page.getByText(/save up to 30%/i)).toBeVisible();
  });
});

test.describe("Pricing Page - Plan Selection", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should show Current Plan button for current tier", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Professional plan should show "Current Plan" button
    const proCard = page.locator("[class*=card]").filter({ has: page.getByRole("heading", { name: "Professional" }) });
    await expect(proCard.getByRole("button", { name: "Current Plan" })).toBeVisible();
  });

  test("should show Upgrade button for higher tier", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Mastery plan should show upgrade option
    const masteryCard = page.locator("[class*=card]").filter({ has: page.getByRole("heading", { name: "Mastery" }) });
    await expect(masteryCard.getByRole("button", { name: /upgrade|contact us/i })).toBeVisible();
  });

  test("should show Downgrade button for lower tier", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Essential plan should show downgrade option for Professional user
    const essentialCard = page.locator("[class*=card]").filter({ has: page.getByRole("heading", { name: "Essential" }) });
    await expect(essentialCard.getByRole("button", { name: /downgrade/i })).toBeVisible();
  });

  test("should disable button for current plan", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Professional plan button should be disabled (current plan)
    const proCard = page.locator("[class*=card]").filter({ has: page.getByRole("heading", { name: "Professional" }) });
    await expect(proCard.getByRole("button", { name: "Current Plan" })).toBeDisabled();
  });
});

test.describe("Pricing Page - Subscription Management", () => {
  test.beforeEach(async ({ page, mockAPI }) => {
    await mockAPI.all(page);
  });

  test("should show manage subscription link for paid users", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // Manage subscription button should be visible for Professional tier user
    await expect(page.getByRole("button", { name: /manage subscription/i })).toBeVisible();
  });
});
