// Mock user data for testing

export const mockSchoolAdmin = {
  id: "admin-1",
  email: "admin@school.com",
  first_name: "Admin",
  last_name: "Test",
  phone: "+33612345678",
  avatar_url: null,
  school_id: "school-1",
  teacher_id: null,
  student_id: null,
  is_active: true,
};

export const mockTeacher = {
  id: "teacher-user-1",
  email: "teacher@school.com",
  first_name: "Prof",
  last_name: "Test",
  phone: "+33687654321",
  avatar_url: null,
  school_id: "school-1",
  teacher_id: "teacher-1",
  student_id: null,
  is_active: true,
};

export const mockStudent = {
  id: "student-user-1",
  email: "student@school.com",
  first_name: "Eleve",
  last_name: "Test",
  phone: null,
  avatar_url: null,
  school_id: "school-1",
  teacher_id: null,
  student_id: "student-1",
  is_active: true,
};

export const mockGlobalAdmin = {
  id: "global-admin-1",
  email: "superadmin@eduvate.com",
  first_name: "Super",
  last_name: "Admin",
  phone: null,
  avatar_url: null,
  school_id: null,
  teacher_id: null,
  student_id: null,
  is_active: true,
};

// Session tokens for testing
export const validSessionTokens = {
  admin: "mock-session-token-admin",
  teacher: "mock-session-token-teacher",
  student: "mock-session-token-student",
  globalAdmin: "mock-session-token-global-admin",
};

// Invalid/expired tokens
export const invalidSessionTokens = {
  expired: "expired-session-token",
  malformed: "not-a-valid-token",
  empty: "",
};
