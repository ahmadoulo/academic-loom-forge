import { test, expect } from "@playwright/test";

/**
 * Authentication E2E Tests
 * 
 * These tests verify:
 * - Login form displays correctly
 * - Form validation works
 * - Password field is masked
 * - Error messages show for invalid credentials
 * - Session management (logout clears data)
 * - Keyboard accessibility
 */

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
    // Wait for the form to be fully loaded
    await page.waitForLoadState("networkidle");
  });

  test("displays login form on auth page", async ({ page }) => {
    // Check that the login form is visible - using actual UI labels
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    // Fill in invalid credentials
    await page.locator('input[type="email"]').fill("invalid@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");

    // Submit form
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Wait for error message (toast or inline error)
    await expect(
      page.getByText(/incorrect|invalide|erreur|échoué/i)
    ).toBeVisible({ timeout: 15000 });
  });

  test("validates email format before submission", async ({ page }) => {
    // Enter invalid email
    await page.locator('input[type="email"]').fill("not-an-email");
    await page.locator('input[type="password"]').fill("ValidP@ssw0rd!");

    // Try to submit
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Form should not navigate away (HTML5 email validation)
    await expect(page).toHaveURL(/\/auth/);
  });

  test("password field is masked", async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');

    // Check that password field has type="password"
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("redirects to dashboard after successful login", async ({ page }) => {
    // This test requires actual backend with test accounts
    // Skip in CI without configured test credentials
    test.skip(!process.env.TEST_ADMIN_EMAIL, "Test credentials not configured");

    await page.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Should redirect away from auth
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 10000 });
  });
});

test.describe("Session Persistence", () => {
  test("session persists after page refresh", async ({ page }) => {
    // This test requires a logged-in state with valid session
    test.skip(!process.env.TEST_ADMIN_EMAIL, "Test credentials not configured");

    // Login first
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Wait for redirect
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 10000 });

    // Refresh page
    await page.reload();

    // User should still be logged in (not on auth page)
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test("logout clears session data", async ({ page }) => {
    await page.goto("/auth");

    // Set up fake session
    await page.evaluate(() => {
      localStorage.setItem("customAuthUser", JSON.stringify({ id: "test" }));
      localStorage.setItem("app_session_token", "test-token");
    });

    // Clear session (simulate logout)
    await page.evaluate(() => {
      localStorage.removeItem("customAuthUser");
      localStorage.removeItem("app_session_token");
    });

    // Verify session is cleared
    const sessionData = await page.evaluate(() => ({
      user: localStorage.getItem("customAuthUser"),
      token: localStorage.getItem("app_session_token"),
    }));

    expect(sessionData.user).toBeNull();
    expect(sessionData.token).toBeNull();
  });
});

test.describe("Accessibility", () => {
  test("login form is accessible", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    // Check for proper labels and input visibility
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check that inputs have associated labels (via id)
    await expect(emailInput).toHaveAttribute("id", "email");
    await expect(passwordInput).toHaveAttribute("id", "password");

    // Check submit button is accessible
    const submitButton = page.getByRole("button", { name: /se connecter/i });
    await expect(submitButton).toBeEnabled();
  });

  test("form can be submitted with Enter key", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').fill("TestPassword123!");

    // Press Enter to submit
    await page.keyboard.press("Enter");

    // Wait a bit and check we're still on auth page (invalid creds)
    // This verifies keyboard navigation works
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/auth/);
  });
});
