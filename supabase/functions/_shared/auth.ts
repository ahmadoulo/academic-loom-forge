import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

// ============================================================
// SHARED AUTHENTICATION MODULE FOR EDGE FUNCTIONS
// ============================================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token',
};

export type AppRole = 
  | 'global_admin'
  | 'school_admin'
  | 'school_staff'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'admission'
  | 'accountant'
  | 'secretary';

export interface UserRole {
  role: AppRole;
  school_id: string | null;
}

export interface SessionValidationResult {
  valid: boolean;
  userId?: string;
  email?: string;
  schoolId?: string | null;
  teacherId?: string | null;
  studentId?: string | null;
  roles?: UserRole[];
  error?: string;
  status?: number;
}

export interface ValidateSessionOptions {
  requiredRoles?: AppRole[];
  requiredSchoolId?: string;
  requireAnyRole?: boolean; // If true, user must have at least one of the required roles
}

/**
 * Create a Supabase admin client with service role key
 */
export function createSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Validate a session token and optionally check for required roles
 * 
 * @param sessionToken - The session token from the request body
 * @param options - Optional validation options (required roles, school ID)
 * @returns SessionValidationResult with user info if valid
 */
export async function validateSession(
  sessionToken: string | undefined | null,
  options: ValidateSessionOptions = {}
): Promise<SessionValidationResult> {
  // Check if token is provided
  if (!sessionToken) {
    return {
      valid: false,
      error: 'Session token requis',
      status: 401,
    };
  }

  try {
    const supabase = createSupabaseAdmin();

    // Fetch user by session token
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('id, email, school_id, teacher_id, student_id, is_active, session_expires_at')
      .eq('session_token', sessionToken)
      .single();

    if (userError || !user) {
      console.error('Session validation failed: user not found');
      return {
        valid: false,
        error: 'Session invalide',
        status: 401,
      };
    }

    // Check if user is active
    if (!user.is_active) {
      console.error('Session validation failed: account disabled');
      return {
        valid: false,
        error: 'Compte désactivé',
        status: 401,
      };
    }

    // Check session expiration
    if (user.session_expires_at && new Date(user.session_expires_at) < new Date()) {
      console.error('Session validation failed: session expired');
      return {
        valid: false,
        error: 'Session expirée',
        status: 401,
      };
    }

    // Fetch user roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('app_user_roles')
      .select('role, school_id')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Failed to fetch roles:', rolesError);
    }

    const roles: UserRole[] = (rolesData || []).map(r => ({
      role: r.role as AppRole,
      school_id: r.school_id,
    }));

    // Check required roles if specified
    if (options.requiredRoles && options.requiredRoles.length > 0) {
      const hasRequiredRole = roles.some(userRole => {
        // Check if user has one of the required roles
        const roleMatch = options.requiredRoles!.includes(userRole.role);
        if (!roleMatch) return false;

        // Global admin bypasses school checks
        if (userRole.role === 'global_admin') return true;

        // If a specific school is required, check school_id match
        if (options.requiredSchoolId) {
          return userRole.school_id === options.requiredSchoolId;
        }

        return true;
      });

      if (!hasRequiredRole) {
        console.error('Session validation failed: insufficient permissions');
        return {
          valid: false,
          error: 'Permissions insuffisantes',
          status: 403,
        };
      }
    }

    // If specific school is required, check user has access to it
    if (options.requiredSchoolId) {
      const hasSchoolAccess = roles.some(r =>
        r.role === 'global_admin' ||
        r.school_id === options.requiredSchoolId
      );

      if (!hasSchoolAccess) {
        console.error('Session validation failed: no access to school');
        return {
          valid: false,
          error: 'Accès à cette école non autorisé',
          status: 403,
        };
      }
    }

    return {
      valid: true,
      userId: user.id,
      email: user.email,
      schoolId: user.school_id,
      teacherId: user.teacher_id,
      studentId: user.student_id,
      roles,
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return {
      valid: false,
      error: 'Erreur de validation de session',
      status: 500,
    };
  }
}

/**
 * Helper to check if user has a specific role
 */
export function hasRole(roles: UserRole[], role: AppRole, schoolId?: string): boolean {
  return roles.some(r => {
    if (r.role === 'global_admin') return true;
    if (r.role !== role) return false;
    if (schoolId && r.school_id !== schoolId) return false;
    return true;
  });
}

/**
 * Helper to check if user is a global admin
 */
export function isGlobalAdmin(roles: UserRole[]): boolean {
  return roles.some(r => r.role === 'global_admin');
}

/**
 * Helper to check if user is a school admin for a specific school
 */
export function isSchoolAdmin(roles: UserRole[], schoolId: string): boolean {
  return roles.some(r =>
    r.role === 'global_admin' ||
    (r.role === 'school_admin' && r.school_id === schoolId)
  );
}

/**
 * Helper to check if user is a teacher for a specific school
 */
export function isTeacher(roles: UserRole[], schoolId?: string): boolean {
  return roles.some(r =>
    r.role === 'global_admin' ||
    (r.role === 'teacher' && (!schoolId || r.school_id === schoolId))
  );
}

/**
 * Helper to get all school IDs the user has access to
 */
export function getUserSchoolIds(roles: UserRole[]): string[] {
  if (isGlobalAdmin(roles)) {
    return []; // Empty means all schools for global admin
  }
  return roles
    .filter(r => r.school_id)
    .map(r => r.school_id as string);
}

/**
 * Create an error response with proper CORS headers
 */
export function errorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create a success response with proper CORS headers
 */
export function successResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
