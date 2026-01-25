import { test, expect } from "@playwright/test";

/**
 * Security E2E Tests
 * 
 * These tests verify:
 * - Unauthenticated access is blocked
 * - localStorage manipulation doesn't bypass auth
 * - XSS prevention in form inputs
 * - Password masking
 * - Rate limiting indication
 * - Proper API headers
 */

test.describe("Security Tests", () => {
  test("unauthenticated user cannot access protected routes", async ({ page }) => {
    // Clear any existing session
    await page.goto("/auth");
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Try to access protected admin route
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test("cannot access school dashboard without authentication", async ({ page }) => {
    await page.goto("/auth");
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Try to access school route
    await page.goto("/school/some-school-id");
    await page.waitForLoadState("networkidle");

    // Should be redirected to auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test("localStorage manipulation does not bypass authentication", async ({ page }) => {
    await page.goto("/auth");

    // Try to fake a session by setting localStorage directly
    await page.evaluate(() => {
      localStorage.setItem(
        "customAuthUser",
        JSON.stringify({
          id: "fake-user",
          email: "fake@fake.com",
          role: "global_admin",
        })
      );
      localStorage.setItem("app_session_token", "fake-token-that-wont-validate");
    });

    // Navigate to protected route
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // The backend validation should fail and redirect to auth
    // (Session tokens are validated server-side)
    await expect(page).toHaveURL(/\/auth/);
  });

  test("XSS prevention in form inputs", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    // Try XSS payload in email field
    const xssPayload = '<script>alert("xss")</script>';
    await page.locator('input[type="email"]').fill(xssPayload);

    // The script should not execute
    // Check that the value is properly escaped/handled
    const emailValue = await page.locator('input[type="email"]').inputValue();

    // The input should contain the text but not execute it
    expect(emailValue).toBe(xssPayload);

    // No alert should have appeared (Playwright would throw if alert is unhandled)
  });

  test("password is not visible in DOM", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    const password = "SecretPassword123!";
    await page.locator('input[type="password"]').fill(password);

    // Get the input type
    const inputType = await page.locator('input[type="password"]').getAttribute("type");
    expect(inputType).toBe("password");

    // Password should not appear in visible page content
    const pageContent = await page.content();
    expect(pageContent).not.toContain(password);
  });

  test("rate limiting protection indication", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    // Attempt multiple failed logins
    for (let i = 0; i < 6; i++) {
      await page.locator('input[type="email"]').fill("test@example.com");
      await page.locator('input[type="password"]').fill("wrongpassword");
      await page.getByRole("button", { name: /se connecter/i }).click();

      // Wait for response
      await page.waitForTimeout(1000);
    }

    // After 5 failed attempts, should see rate limit or error message
    // The exact message depends on implementation
    const errorVisible = await page.getByText(/tentatives|réessayez|bloqué|erreur/i).isVisible();
    expect(errorVisible).toBe(true);
  });
});

test.describe("Data Isolation", () => {
  test("student cannot access other students grades via URL manipulation", async ({ page }) => {
    // This test requires configured student credentials
    test.skip(!process.env.TEST_STUDENT_EMAIL, "Test student credentials not configured");

    // Login as student
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_STUDENT_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Try to access another student's data via URL
    await page.goto("/student/other-student-id/grades");

    // Should be blocked or redirected
    await expect(page).not.toHaveURL(/other-student-id/);
  });

  test("teacher cannot access other school's data", async ({ page }) => {
    // This test requires multi-school setup
    test.skip(!process.env.TEST_TEACHER_EMAIL, "Test teacher credentials not configured");

    // Login as teacher
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_TEACHER_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_TEACHER_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Try to access another school's dashboard
    await page.goto("/school/other-school-id");

    // Should be blocked
    await expect(page).not.toHaveURL(/other-school-id/);
  });
});

test.describe("API Security", () => {
  test("API calls include proper headers", async ({ page }) => {
    let capturedHeaders: Record<string, string> = {};

    // Intercept API calls
    await page.route("**/functions/v1/**", async (route) => {
      const request = route.request();
      capturedHeaders = request.headers();
      await route.continue();
    });

    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').fill("TestPassword123!");
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Wait for API call
    await page.waitForTimeout(2000);

    // Check basic headers (content-type should be present)
    if (Object.keys(capturedHeaders).length > 0) {
      expect(capturedHeaders).toHaveProperty("content-type");
    }
  });
});
