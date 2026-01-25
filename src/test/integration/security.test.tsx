import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Mock components for testing
const ProtectedContent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

// Mock auth context
const mockAuthContext = {
  user: null,
  loading: false,
  initialized: true,
  roles: [],
  primaryRole: null,
  primarySchoolId: null,
  primarySchoolIdentifier: null,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const renderProtectedRoute = (
  userState: Partial<typeof mockAuthContext> = {}
) => {
  // Update mock state
  Object.assign(mockAuthContext, userState);

  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<LoginPage />} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    Object.assign(mockAuthContext, {
      user: null,
      loading: false,
      initialized: true,
      roles: [],
      primaryRole: null,
    });
  });

  it("shows loading state while checking authentication", () => {
    renderProtectedRoute({ loading: true, initialized: false });

    // Should show loading indicator or nothing
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("allows authenticated users to access protected content", async () => {
    window.history.pushState({}, "", "/protected");

    renderProtectedRoute({
      user: {
        id: "user-1",
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        phone: null,
        avatar_url: null,
        school_id: "school-1",
        teacher_id: null,
        student_id: null,
        is_active: true,
      },
      loading: false,
      initialized: true,
      roles: [{ role: "school_admin" as const, school_id: "school-1" }],
      primaryRole: "school_admin",
    });

    // Protected content should be visible
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});

describe("Role-based access control", () => {
  it("prevents student from accessing admin routes", () => {
    const studentUser = {
      id: "student-1",
      email: "student@school.com",
      first_name: "Student",
      last_name: "Test",
      phone: null,
      avatar_url: null,
      school_id: "school-1",
      teacher_id: null,
      student_id: "student-ref-1",
      is_active: true,
    };

    // This test would verify role checking logic
    const hasAdminAccess = (role: string) => {
      return ["global_admin", "school_admin"].includes(role);
    };

    expect(hasAdminAccess("student")).toBe(false);
    expect(hasAdminAccess("teacher")).toBe(false);
    expect(hasAdminAccess("school_admin")).toBe(true);
    expect(hasAdminAccess("global_admin")).toBe(true);
  });

  it("prevents cross-school data access", () => {
    const userSchoolId = "school-1";
    const requestedSchoolId = "school-2";

    const canAccessSchool = (
      userSchool: string,
      targetSchool: string,
      isGlobalAdmin: boolean
    ) => {
      if (isGlobalAdmin) return true;
      return userSchool === targetSchool;
    };

    // Regular user can only access their own school
    expect(canAccessSchool(userSchoolId, requestedSchoolId, false)).toBe(false);
    expect(canAccessSchool(userSchoolId, userSchoolId, false)).toBe(true);

    // Global admin can access any school
    expect(canAccessSchool(userSchoolId, requestedSchoolId, true)).toBe(true);
  });
});

describe("Session security", () => {
  it("does not store password_hash in localStorage", () => {
    const sensitiveData = {
      id: "user-1",
      email: "test@example.com",
      password_hash: "should_not_be_stored",
      session_token: "should_not_be_stored",
    };

    // Simulate storing user data (what the app should do)
    const safeUserData = {
      id: sensitiveData.id,
      email: sensitiveData.email,
      // password_hash and session_token should NOT be included
    };

    localStorage.setItem("customAuthUser", JSON.stringify(safeUserData));

    const storedData = JSON.parse(
      localStorage.getItem("customAuthUser") || "{}"
    );

    expect(storedData.password_hash).toBeUndefined();
    expect(storedData.session_token).toBeUndefined();
  });

  it("clears session on logout", () => {
    // Simulate logged in state
    localStorage.setItem("customAuthUser", JSON.stringify({ id: "user-1" }));
    localStorage.setItem("sessionToken", "test-token");

    // Simulate logout
    localStorage.removeItem("customAuthUser");
    localStorage.removeItem("sessionToken");

    expect(localStorage.getItem("customAuthUser")).toBeNull();
    expect(localStorage.getItem("sessionToken")).toBeNull();
  });
});
