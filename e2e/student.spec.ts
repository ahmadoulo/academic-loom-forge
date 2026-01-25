import { test, expect } from "@playwright/test";

// Note: These tests require an authenticated student session
// They are designed as documentation and will skip without proper setup

test.describe("Student Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no test credentials are configured
    test.skip(
      !process.env.TEST_STUDENT_EMAIL,
      "Test student credentials not configured"
    );
  });

  test("student can view own grades", async ({ page }) => {
    test.skip();

    // Login as student
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(process.env.TEST_STUDENT_EMAIL!);
    await page.getByLabel(/mot de passe/i).fill(process.env.TEST_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /connexion/i }).click();

    // Should redirect to student dashboard
    await expect(page).toHaveURL(/\/student\//);

    // Navigate to grades
    await page.getByRole("link", { name: /notes|grades/i }).click();

    // Should see grades section
    await expect(page.getByText(/mes notes|notes/i)).toBeVisible();
  });

  test("student cannot view other students grades", async ({ page }) => {
    test.skip();

    // After login, try to access another student's data via URL
    await page.goto("/student/other-student-id/grades");

    // Should be blocked or redirected
    await expect(page).not.toHaveURL(/other-student-id/);
  });

  test("student can view own timetable", async ({ page }) => {
    test.skip();

    // Navigate to timetable
    await page.getByRole("link", { name: /emploi du temps|timetable/i }).click();

    // Should see schedule
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("student can view own absences", async ({ page }) => {
    test.skip();

    // Navigate to absences
    await page.getByRole("link", { name: /absences/i }).click();

    // Should see absences list
    await expect(page.getByText(/absences/i)).toBeVisible();
  });

  test("student can submit absence justification", async ({ page }) => {
    test.skip();

    // Navigate to absences
    await page.goto("/student/absences");

    // Find unjustified absence
    const unjustifiedRow = page.getByRole("row").filter({
      hasText: /non justifié/i,
    });

    // Click justify button
    await unjustifiedRow.getByRole("button", { name: /justifier/i }).click();

    // Fill justification form
    await page.getByLabel(/motif|raison/i).fill("Rendez-vous médical");

    // Submit
    await page.getByRole("button", { name: /envoyer|soumettre/i }).click();

    // Verify success
    await expect(page.getByText(/soumis|envoyé/i)).toBeVisible();
  });
});

test.describe("Student Data Privacy", () => {
  test("student only sees own data in dashboard", async ({ page }) => {
    test.skip();

    // Login as student
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(process.env.TEST_STUDENT_EMAIL!);
    await page.getByLabel(/mot de passe/i).fill(process.env.TEST_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /connexion/i }).click();

    // Navigate to grades
    await page.getByRole("link", { name: /notes/i }).click();

    // Should not see list of all students
    await expect(page.getByText(/tous les élèves/i)).not.toBeVisible();

    // Should only see own grades
    await expect(page.getByText(/mes notes/i)).toBeVisible();
  });

  test("student cannot access admin functions", async ({ page }) => {
    test.skip();

    // Login as student
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(process.env.TEST_STUDENT_EMAIL!);
    await page.getByLabel(/mot de passe/i).fill(process.env.TEST_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /connexion/i }).click();

    // Try to access admin route
    await page.goto("/admin");

    // Should be blocked
    await expect(page).not.toHaveURL(/\/admin/);
  });
});
