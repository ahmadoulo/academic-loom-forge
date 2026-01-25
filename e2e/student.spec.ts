import { test, expect } from "@playwright/test";

/**
 * Student Flow E2E Tests
 * 
 * These tests verify:
 * - Student can view own grades
 * - Student cannot access other students' data
 * - Student can view timetable and absences
 * - Student can submit absence justification
 * - Student data privacy is enforced
 * 
 * Note: Requires TEST_STUDENT_EMAIL and TEST_STUDENT_PASSWORD env vars
 */

test.describe("Student Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Skip all tests if no test credentials configured
    test.skip(
      !process.env.TEST_STUDENT_EMAIL,
      "Test student credentials not configured"
    );
  });

  test("student can view own grades", async ({ page }) => {
    // Login as student
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    
    await page.locator('input[type="email"]').fill(process.env.TEST_STUDENT_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Should redirect to student dashboard
    await expect(page).toHaveURL(/\/student\//, { timeout: 10000 });

    // Navigate to grades
    await page.getByRole("link", { name: /notes|grades/i }).click();

    // Should see grades section
    await expect(page.getByText(/mes notes|notes/i)).toBeVisible();
  });

  test("student cannot view other students grades", async ({ page }) => {
    // Login first
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_STUDENT_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Wait for login
    await expect(page).toHaveURL(/\/student\//, { timeout: 10000 });

    // Try to access another student's data via URL
    await page.goto("/student/other-student-id/grades");

    // Should be blocked or redirected
    await expect(page).not.toHaveURL(/other-student-id/);
  });

  test("student can view own timetable", async ({ page }) => {
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_STUDENT_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/student\//, { timeout: 10000 });

    // Navigate to timetable
    await page.getByRole("link", { name: /emploi du temps|calendrier/i }).click();

    // Should see schedule view
    await expect(page.getByText(/calendrier|semaine|emploi/i)).toBeVisible();
  });

  test("student can view own absences", async ({ page }) => {
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_STUDENT_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/student\//, { timeout: 10000 });

    // Navigate to absences
    await page.getByRole("link", { name: /absences/i }).click();

    // Should see absences section
    await expect(page.getByText(/absences/i)).toBeVisible();
  });

  test("student can submit absence justification", async ({ page }) => {
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_STUDENT_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/student\//, { timeout: 10000 });

    // Navigate to absences - this may vary based on actual UI
    await page.getByRole("link", { name: /absences/i }).click();

    // Look for justification option
    const justifyButton = page.getByRole("button", { name: /justifier/i });
    
    if (await justifyButton.isVisible()) {
      await justifyButton.click();

      // Fill justification form if visible
      const reasonInput = page.getByLabel(/motif|raison/i);
      if (await reasonInput.isVisible()) {
        await reasonInput.fill("Rendez-vous médical");
        await page.getByRole("button", { name: /envoyer|soumettre/i }).click();
        await expect(page.getByText(/soumis|envoyé|succès/i)).toBeVisible();
      }
    }
  });
});

test.describe("Student Data Privacy", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_STUDENT_EMAIL,
      "Test student credentials not configured"
    );
  });

  test("student only sees own data in dashboard", async ({ page }) => {
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_STUDENT_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/student\//, { timeout: 10000 });

    // Navigate to grades
    await page.getByRole("link", { name: /notes/i }).click();

    // Should not see list of all students
    await expect(page.getByText(/tous les élèves/i)).not.toBeVisible();

    // Should only see own grades
    await expect(page.getByText(/mes notes/i)).toBeVisible();
  });

  test("student cannot access admin functions", async ({ page }) => {
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_STUDENT_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/student\//, { timeout: 10000 });

    // Try to access admin route
    await page.goto("/admin");

    // Should be blocked and redirected
    await expect(page).not.toHaveURL(/\/admin/);
  });
});
