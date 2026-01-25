import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  handleCors,
  validateSession,
  isGlobalAdmin,
  isSchoolAdmin,
  errorResponse,
} from "../_shared/auth.ts";

interface CreateUserRequest {
  sessionToken: string; // Required for authentication
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  schoolId?: string;
  password?: string;
  schoolRoleId?: string;
}

// Roles that require a school_id
const SCHOOL_BOUND_ROLES = ["school_admin", "school_staff", "teacher", "student", "admission", "accountant", "secretary"];

// Hash password using SHA-256 (Deno compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body: CreateUserRequest = await req.json();
    const {
      sessionToken,
      email,
      firstName,
      lastName,
      phone,
      role,
      schoolId,
      password,
      schoolRoleId,
    } = body;

    console.log('Create user request received:', { email, firstName, lastName, role, schoolId });

    // ============================================================
    // SECURITY: Validate session and check permissions
    // ============================================================
    const session = await validateSession(sessionToken, {
      requiredRoles: ['global_admin', 'school_admin'],
      requiredSchoolId: SCHOOL_BOUND_ROLES.includes(role) ? schoolId : undefined,
    });

    if (!session.valid) {
      console.error('Session validation failed:', session.error);
      return errorResponse(session.error || 'Non autorisé', session.status || 401);
    }

    console.log(`User ${session.userId} creating account for ${email}`);

    // Additional permission check: school_admin can only create users for their school
    if (!isGlobalAdmin(session.roles || [])) {
      if (role === 'global_admin') {
        return errorResponse('Seul un administrateur global peut créer un autre administrateur global', 403);
      }
      if (schoolId && !isSchoolAdmin(session.roles || [], schoolId)) {
        return errorResponse('Vous ne pouvez créer des utilisateurs que pour vos écoles', 403);
      }
    }

    // ============================================================
    // VALIDATION
    // ============================================================
    if (!email || !firstName || !lastName || !role) {
      return errorResponse('Email, prénom, nom et rôle sont requis', 400);
    }

    if (SCHOOL_BOUND_ROLES.includes(role) && !schoolId) {
      return errorResponse('school_id est requis pour ce rôle', 400);
    }

    if (!password) {
      return errorResponse('Mot de passe requis pour créer un compte', 400);
    }

    // ============================================================
    // CREATE USER
    // ============================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return errorResponse('Erreur lors de la vérification de l\'email', 500);
    }

    if (existingUser) {
      return errorResponse('Un compte existe déjà avec cet email', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userSchoolId = SCHOOL_BOUND_ROLES.includes(role) ? (schoolId || null) : null;

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('app_users')
      .insert({
        email: email.toLowerCase().trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone?.trim() || null,
        school_id: userSchoolId,
        password_hash: passwordHash,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create user:', createError);
      return errorResponse('Erreur lors de la création du compte', 500);
    }

    console.log(`User created with ID: ${newUser.id}`);

    // Assign app_user_role
    const { error: roleError } = await supabase
      .from("app_user_roles")
      .insert({
        user_id: newUser.id,
        role: role,
        school_id: userSchoolId,
        granted_by: session.userId,
      });

    if (roleError) {
      console.error('Failed to assign app role:', roleError);
      // Rollback user creation
      await supabase.from('app_users').delete().eq('id', newUser.id);
      return errorResponse('Erreur lors de l\'attribution du rôle', 500);
    }

    // If schoolRoleId is provided, also assign the custom school role
    if (schoolRoleId && userSchoolId) {
      const { error: schoolRoleError } = await supabase
        .from("user_school_roles")
        .insert({
          user_id: newUser.id,
          school_role_id: schoolRoleId,
          school_id: userSchoolId,
          granted_by: session.userId,
        });

      if (schoolRoleError) {
        console.error('Failed to assign school role:', schoolRoleError);
      }
    }

    console.log(`User ${email} created successfully by ${session.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          is_active: newUser.is_active,
        },
        role,
        schoolRoleId,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse('Erreur serveur lors de la création du compte', 500);
  }
});
