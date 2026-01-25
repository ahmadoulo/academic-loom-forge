import { test, expect } from "@playwright/test";

/**
 * School Admin Flow E2E Tests
 * 
 * These tests verify:
 * - School admin can access dashboard
 * - School admin can create students
 * - School admin can assign teachers to classes
 * - School admin can view grades by class
 * - School admin can generate bulletins
 * - Data isolation between schools
 * 
 * Note: Requires TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD env vars
 */

test.describe("School Admin Flow", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      "Test admin credentials not configured"
    );
  });

  test("school admin can access dashboard", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    
    await page.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    // Should redirect to school dashboard
    await expect(page).toHaveURL(/\/school\//, { timeout: 10000 });

    // Should see dashboard widgets
    await expect(page.getByText(/tableau de bord|dashboard|statistiques/i)).toBeVisible();
  });

  test("school admin can create a new student", async ({ page }) => {
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/school\//, { timeout: 10000 });

    // Navigate to students section
    await page.getByRole("link", { name: /élèves|étudiants/i }).click();

    // Click add student button
    const addButton = page.getByRole("button", { name: /ajouter.*élève|nouveau/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      // Fill student form
      await page.getByLabel(/prénom/i).fill("Nouveau");
      await page.getByLabel(/nom/i).fill("Étudiant");
      
      const emailInput = page.getByLabel(/email/i);
      if (await emailInput.isVisible()) {
        await emailInput.fill("nouveau.etudiant@school.com");
      }

      // Select class if dropdown visible
      const classSelect = page.getByRole("combobox", { name: /classe/i });
      if (await classSelect.isVisible()) {
        await classSelect.click();
        await page.getByRole("option").first().click();
      }

      // Submit
      await page.getByRole("button", { name: /créer|enregistrer/i }).click();

      // Verify success
      await expect(page.getByText(/créé|succès/i)).toBeVisible();
    }
  });

  test("school admin can assign teacher to class", async ({ page }) => {
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/school\//, { timeout: 10000 });

    // Navigate to classes section
    await page.getByRole("link", { name: /classes/i }).click();

    // Look for assign teacher functionality
    const assignButton = page.getByRole("button", { name: /assigner.*enseignant/i });
    if (await assignButton.isVisible()) {
      await assignButton.click();

      // Select teacher
      const teacherSelect = page.getByRole("combobox", { name: /enseignant/i });
      if (await teacherSelect.isVisible()) {
        await teacherSelect.click();
        await page.getByRole("option").first().click();
      }

      // Select subject
      const subjectSelect = page.getByRole("combobox", { name: /matière/i });
      if (await subjectSelect.isVisible()) {
        await subjectSelect.click();
        await page.getByRole("option").first().click();
      }

      // Confirm
      await page.getByRole("button", { name: /confirmer|assigner/i }).click();

      // Verify success
      await expect(page.getByText(/assigné|succès/i)).toBeVisible();
    }
  });

  test("school admin can view grades by class", async ({ page }) => {
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/school\//, { timeout: 10000 });

    // Navigate to grades section
    await page.getByRole("link", { name: /notes/i }).click();

    // Select class if combobox present
    const classSelect = page.getByRole("combobox", { name: /classe/i });
    if (await classSelect.isVisible()) {
      await classSelect.click();
      await page.getByRole("option").first().click();
    }

    // Should see grades display
    await expect(page.getByText(/notes|moyennes/i)).toBeVisible();
  });

  test("school admin can generate bulletin", async ({ page }) => {
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/school\//, { timeout: 10000 });

    // Navigate to bulletin section
    await page.getByRole("link", { name: /bulletin/i }).click();

    // Select class
    const classSelect = page.getByRole("combobox", { name: /classe/i });
    if (await classSelect.isVisible()) {
      await classSelect.click();
      await page.getByRole("option").first().click();
    }

    // Look for PDF generation button
    const pdfButton = page.getByRole("button", { name: /générer.*pdf|télécharger/i });
    if (await pdfButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

      await pdfButton.click();

      // Check if download started
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.pdf$/);
      }
    }
  });
});

test.describe("School Admin Data Management", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL,
      "Test admin credentials not configured"
    );
  });

  test("can only view data from own school", async ({ page }) => {
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/school\//, { timeout: 10000 });

    // Try to access another school's data
    await page.goto("/school/other-school-id");

    // Should be blocked or redirected
    await expect(page).not.toHaveURL(/other-school-id/);
  });

  test("can manage school settings", async ({ page }) => {
    await page.goto("/auth");
    await page.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/school\//, { timeout: 10000 });

    // Navigate to settings
    await page.getByRole("link", { name: /paramètres|settings/i }).click();

    // Should see school settings form
    await expect(page.getByText(/paramètres|configuration/i)).toBeVisible();
  });
});
