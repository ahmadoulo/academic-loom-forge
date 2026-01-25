import { describe, it, expect } from "vitest";

/**
 * Tests for email and password validation
 * These mirror the validation logic in supabase/functions/_shared/auth.ts
 */

// Email validation function (mirrors backend)
const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email requis" };
  }

  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0) {
    return { valid: false, error: "Email requis" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Format d'email invalide" };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: "Email trop long" };
  }

  return { valid: true };
};

// Password validation function (mirrors backend)
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password || typeof password !== "string") {
    return { valid: false, errors: ["Mot de passe requis"] };
  }

  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }

  if (password.length > 128) {
    errors.push("Le mot de passe ne peut pas dépasser 128 caractères");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }

  if (!/\d/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  if (!/[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'\/~`]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial");
  }

  // Check common passwords
  const commonPasswords = ["password", "123456", "qwerty", "azerty"];
  if (commonPasswords.some((p) => password.toLowerCase().includes(p))) {
    errors.push("Ce mot de passe est trop courant");
  }

  return { valid: errors.length === 0, errors };
};

describe("Email Validation", () => {
  it("accepts valid email formats", () => {
    const validEmails = [
      "test@example.com",
      "user.name@domain.org",
      "user+tag@example.co.uk",
      "firstname.lastname@company.com",
    ];

    validEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  it("rejects invalid email formats", () => {
    const invalidEmails = [
      "notanemail",
      "@nodomain.com",
      "no@domain",
      "spaces in@email.com",
      "",
      "   ",
    ];

    invalidEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  it("trims whitespace from emails", () => {
    const result = validateEmail("  test@example.com  ");
    expect(result.valid).toBe(true);
  });

  it("rejects emails that are too long", () => {
    const longEmail = "a".repeat(250) + "@test.com";
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Email trop long");
  });

  it("handles null and undefined", () => {
    expect(validateEmail(null as any).valid).toBe(false);
    expect(validateEmail(undefined as any).valid).toBe(false);
  });
});

describe("Password Validation", () => {
  it("accepts strong passwords", () => {
    const strongPasswords = [
      "ValidP@ssw0rd!",
      "MySecure#Pass123",
      "C0mpl3x!Password",
    ];

    strongPasswords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it("rejects passwords that are too short", () => {
    const result = validatePassword("Aa1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Le mot de passe doit contenir au moins 8 caractères"
    );
  });

  it("rejects passwords without uppercase", () => {
    const result = validatePassword("lowercase1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Le mot de passe doit contenir au moins une majuscule"
    );
  });

  it("rejects passwords without lowercase", () => {
    const result = validatePassword("UPPERCASE1!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Le mot de passe doit contenir au moins une minuscule"
    );
  });

  it("rejects passwords without numbers", () => {
    const result = validatePassword("NoNumbers!");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Le mot de passe doit contenir au moins un chiffre"
    );
  });

  it("rejects passwords without special characters", () => {
    const result = validatePassword("NoSpecial123");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Le mot de passe doit contenir au moins un caractère spécial"
    );
  });

  it("rejects common passwords", () => {
    const commonPasswords = ["Password123!", "123456Aa!", "QwertyTest1!"];

    commonPasswords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.errors).toContain("Ce mot de passe est trop courant");
    });
  });

  it("rejects passwords that are too long", () => {
    const longPassword = "Aa1!" + "x".repeat(130);
    const result = validatePassword(longPassword);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Le mot de passe ne peut pas dépasser 128 caractères"
    );
  });

  it("returns multiple errors for weak passwords", () => {
    const result = validatePassword("weak");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe("Session Token Validation", () => {
  const isValidSessionToken = (token: string): boolean => {
    if (!token || typeof token !== "string") return false;
    // UUID-UUID format expected
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(token);
  };

  it("validates correct session token format", () => {
    const validToken =
      "550e8400-e29b-41d4-a716-446655440000-550e8400-e29b-41d4-a716-446655440001";
    expect(isValidSessionToken(validToken)).toBe(true);
  });

  it("rejects invalid session tokens", () => {
    expect(isValidSessionToken("")).toBe(false);
    expect(isValidSessionToken("not-a-token")).toBe(false);
    expect(isValidSessionToken("550e8400-e29b-41d4-a716-446655440000")).toBe(false);
    expect(isValidSessionToken(null as any)).toBe(false);
  });
});
