import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthPage from "@/pages/AuthPage";

// Mock the auth hooks
vi.mock("@/hooks/useHybridAuth", () => ({
  useHybridAuth: () => ({
    user: null,
    loading: false,
    loginWithCredentials: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/useCustomAuth", () => ({
  useCustomAuth: () => ({
    user: null,
    loading: false,
    loginWithCredentials: vi.fn(),
    logout: vi.fn(),
    createUserCredential: vi.fn(),
    checkAuthStatus: vi.fn(),
  }),
}));

const renderAuthPage = () => {
  return render(
    <BrowserRouter>
      <AuthPage />
    </BrowserRouter>
  );
};

describe("AuthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders login form by default", () => {
    renderAuthPage();
    
    // Check for email and password fields
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
  });

  it("has email input field", () => {
    renderAuthPage();
    const emailInput = document.querySelector('input[type="email"]');
    expect(emailInput).toBeTruthy();
  });

  it("has password input field", () => {
    renderAuthPage();
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toBeTruthy();
  });

  it("password field is masked", () => {
    renderAuthPage();
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput?.getAttribute("type")).toBe("password");
  });

  it("has a submit button", () => {
    renderAuthPage();
    const submitButton = document.querySelector('button[type="submit"]');
    expect(submitButton).toBeTruthy();
  });
});
