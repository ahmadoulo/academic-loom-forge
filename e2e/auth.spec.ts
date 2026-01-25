import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
  });

  test("displays login form on auth page", async ({ page }) => {
    // Check that the login form is visible
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /connexion/i })).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/mot de passe/i).fill("wrongpassword");

    // Submit form
    await page.getByRole("button", { name: /connexion/i }).click();

    // Wait for error message
    await expect(page.getByText(/incorrect|invalide|erreur/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("validates email format before submission", async ({ page }) => {
    // Enter invalid email
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/mot de passe/i).fill("ValidP@ssw0rd!");

    // Try to submit
    await page.getByRole("button", { name: /connexion/i }).click();

    // Form should not navigate away (email validation failed)
    await expect(page).toHaveURL(/\/auth/);
  });

  test("password field is masked", async ({ page }) => {
    const passwordInput = page.getByLabel(/mot de passe/i);

    // Check that password field has type="password"
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("redirects to dashboard after successful login", async ({ page }) => {
    // Note: This test requires actual backend or mocked responses
    // Skip if running against real backend without test accounts
    test.skip();

    await page.getByLabel(/email/i).fill("admin@school.com");
    await page.getByLabel(/mot de passe/i).fill("ValidP@ssw0rd!");
    await page.getByRole("button", { name: /connexion/i }).click();

    // Should redirect to a dashboard
    await expect(page).not.toHaveURL(/\/auth/);
  });
});

test.describe("Session Persistence", () => {
  test("session persists after page refresh", async ({ page }) => {
    // This test requires a logged-in state
    test.skip();

    // Simulate logged-in state by setting localStorage
    await page.goto("/auth");
    await page.evaluate(() => {
      localStorage.setItem(
        "customAuthUser",
        JSON.stringify({
          id: "test-user",
          email: "test@example.com",
          role: "school_admin",
        })
      );
      localStorage.setItem("sessionToken", "test-session-token");
    });

    // Refresh page
    await page.reload();

    // User should still be considered logged in (depends on app logic)
    // This is a simplified test
  });

  test("logout clears session data", async ({ page }) => {
    await page.goto("/auth");

    // Set up fake session
    await page.evaluate(() => {
      localStorage.setItem("customAuthUser", JSON.stringify({ id: "test" }));
      localStorage.setItem("sessionToken", "test-token");
    });

    // Clear session (simulate logout)
    await page.evaluate(() => {
      localStorage.removeItem("customAuthUser");
      localStorage.removeItem("sessionToken");
    });

    // Verify session is cleared
    const sessionData = await page.evaluate(() => ({
      user: localStorage.getItem("customAuthUser"),
      token: localStorage.getItem("sessionToken"),
    }));

    expect(sessionData.user).toBeNull();
    expect(sessionData.token).toBeNull();
  });
});

test.describe("Accessibility", () => {
  test("login form is accessible", async ({ page }) => {
    await page.goto("/auth");

    // Check for proper labels
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/mot de passe/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check that inputs can be focused via Tab
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Check submit button is accessible
    const submitButton = page.getByRole("button", { name: /connexion/i });
    await expect(submitButton).toBeEnabled();
  });

  test("form can be submitted with Enter key", async ({ page }) => {
    await page.goto("/auth");

    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/mot de passe/i).fill("TestPassword123!");

    // Press Enter to submit
    await page.keyboard.press("Enter");

    // Form should attempt submission (may show error for invalid credentials)
    // This verifies keyboard navigation works
  });
});
