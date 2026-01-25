import { http, HttpResponse } from "msw";
import { mockSchoolAdmin, mockTeacher, mockStudent } from "../fixtures/users";

const SUPABASE_URL = "https://nqsvluszgpqnoqybzpvk.supabase.co";

export const handlers = [
  // authenticate-user Edge Function
  http.post(`${SUPABASE_URL}/functions/v1/authenticate-user`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;

    // Valid admin credentials
    if (email === "admin@school.com" && password === "ValidP@ssw0rd!") {
      return HttpResponse.json({
        user: mockSchoolAdmin,
        roles: [{ role: "school_admin", school_id: "school-1" }],
        primaryRole: "school_admin",
        primarySchoolId: "school-1",
        primarySchoolIdentifier: "test-school",
        sessionToken: "mock-session-token-admin",
        sessionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Valid teacher credentials
    if (email === "teacher@school.com" && password === "ValidP@ssw0rd!") {
      return HttpResponse.json({
        user: mockTeacher,
        roles: [{ role: "teacher", school_id: "school-1" }],
        primaryRole: "teacher",
        primarySchoolId: "school-1",
        primarySchoolIdentifier: "test-school",
        sessionToken: "mock-session-token-teacher",
        sessionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Valid student credentials
    if (email === "student@school.com" && password === "ValidP@ssw0rd!") {
      return HttpResponse.json({
        user: mockStudent,
        roles: [{ role: "student", school_id: "school-1" }],
        primaryRole: "student",
        primarySchoolId: "school-1",
        primarySchoolIdentifier: "test-school",
        sessionToken: "mock-session-token-student",
        sessionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Invalid credentials
    return HttpResponse.json(
      { error: "Email ou mot de passe incorrect" },
      { status: 401 }
    );
  }),

  // validate-session Edge Function
  http.post(`${SUPABASE_URL}/functions/v1/validate-session`, async ({ request }) => {
    const body = await request.json() as { sessionToken: string };
    const { sessionToken } = body;

    if (sessionToken === "mock-session-token-admin") {
      return HttpResponse.json({
        valid: true,
        user: mockSchoolAdmin,
        roles: [{ role: "school_admin", school_id: "school-1" }],
        primaryRole: "school_admin",
        primarySchoolId: "school-1",
        primarySchoolIdentifier: "test-school",
        sessionToken: "mock-session-token-admin",
        sessionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    if (sessionToken === "mock-session-token-teacher") {
      return HttpResponse.json({
        valid: true,
        user: mockTeacher,
        roles: [{ role: "teacher", school_id: "school-1" }],
        primaryRole: "teacher",
        primarySchoolId: "school-1",
        primarySchoolIdentifier: "test-school",
        sessionToken: "mock-session-token-teacher",
        sessionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return HttpResponse.json(
      { valid: false, error: "Session invalide" },
      { status: 401 }
    );
  }),

  // create-user-account Edge Function
  http.post(`${SUPABASE_URL}/functions/v1/create-user-account`, async ({ request }) => {
    const body = await request.json() as { 
      email: string; 
      firstName: string; 
      lastName: string;
      password: string;
      role: string;
    };

    // Check required fields
    if (!body.email || !body.firstName || !body.lastName) {
      return HttpResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!body.email.includes("@")) {
      return HttpResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (body.email === "existing@school.com") {
      return HttpResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    return HttpResponse.json({
      user: {
        id: "new-user-id",
        email: body.email,
        first_name: body.firstName,
        last_name: body.lastName,
        is_active: true,
      },
      message: "Utilisateur créé avec succès",
    });
  }),

  // Mock Supabase REST API - grades
  http.get(`${SUPABASE_URL}/rest/v1/grades*`, () => {
    return HttpResponse.json([
      {
        id: "grade-1",
        student_id: "student-1",
        subject_id: "subject-1",
        grade: 15.5,
        grade_type: "controle",
        teacher_id: "teacher-1",
        created_at: new Date().toISOString(),
      },
      {
        id: "grade-2",
        student_id: "student-1",
        subject_id: "subject-1",
        grade: 18,
        grade_type: "examen",
        teacher_id: "teacher-1",
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Mock Supabase REST API - students
  http.get(`${SUPABASE_URL}/rest/v1/students*`, () => {
    return HttpResponse.json([
      {
        id: "student-1",
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@school.com",
        school_id: "school-1",
      },
    ]);
  }),

  // Mock Supabase REST API - classes
  http.get(`${SUPABASE_URL}/rest/v1/classes*`, () => {
    return HttpResponse.json([
      {
        id: "class-1",
        name: "Terminale S1",
        school_id: "school-1",
        school_year_id: "year-1",
      },
    ]);
  }),

  // Mock Supabase REST API - school_years
  http.get(`${SUPABASE_URL}/rest/v1/school_years*`, () => {
    return HttpResponse.json([
      {
        id: "year-1",
        name: "2025-2026",
        start_date: "2025-09-01",
        end_date: "2026-06-30",
        is_current: true,
      },
    ]);
  }),

  // Mock Supabase Auth
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json(null, { status: 401 });
  }),

  http.post(`${SUPABASE_URL}/auth/v1/token*`, () => {
    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),
];
