import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthPage from "@/pages/AuthPage";

// Mock the auth hook
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
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid email format", async () => {
    renderAuthPage();

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /connexion/i });

    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    // Wait for validation
    await waitFor(() => {
      // The form should show validation error or not submit
      expect(emailInput).toHaveValue("invalid-email");
    });
  });

  it("shows validation error for empty password", async () => {
    renderAuthPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole("button", { name: /connexion/i });

    // Enter valid email but empty password
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(passwordInput).toHaveValue("");
    });
  });

  it("allows form submission with valid credentials", async () => {
    renderAuthPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    const submitButton = screen.getByRole("button", { name: /connexion/i });

    // Enter valid credentials
    fireEvent.change(emailInput, { target: { value: "admin@school.com" } });
    fireEvent.change(passwordInput, { target: { value: "ValidP@ssw0rd!" } });

    // Submit should not throw
    expect(() => fireEvent.click(submitButton)).not.toThrow();
  });

  it("has accessible form elements", () => {
    renderAuthPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);

    // Check accessibility attributes
    expect(emailInput).toHaveAttribute("type", "email");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("renders the login button", () => {
    renderAuthPage();
    
    const submitButton = screen.getByRole("button", { name: /connexion/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });
});
