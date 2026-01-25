import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateEmail, validatePassword } from "./auth.ts";

Deno.test("validateEmail - valid email returns valid", () => {
  const result = validateEmail("test@example.com");
  assertEquals(result.valid, true);
});

Deno.test("validateEmail - invalid email returns error", () => {
  const result = validateEmail("invalid-email");
  assertEquals(result.valid, false);
  assertExists(result.error);
});

Deno.test("validateEmail - empty email returns error", () => {
  const result = validateEmail("");
  assertEquals(result.valid, false);
});

Deno.test("validatePassword - strong password is valid", () => {
  const result = validatePassword("SecurePass123!");
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validatePassword - short password is invalid", () => {
  const result = validatePassword("Short1!");
  assertEquals(result.valid, false);
  assertEquals(result.errors.length > 0, true);
});

Deno.test("validatePassword - password without uppercase is invalid", () => {
  const result = validatePassword("lowercase123!");
  assertEquals(result.valid, false);
});

Deno.test("validatePassword - password without number is invalid", () => {
  const result = validatePassword("NoNumberHere!");
  assertEquals(result.valid, false);
});
