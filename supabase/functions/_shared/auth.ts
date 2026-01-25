import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// ============================================================
// SHARED AUTHENTICATION MODULE FOR EDGE FUNCTIONS
// With bcrypt password hashing and enhanced security
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
  requireAnyRole?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password complexity requirements
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/,
};

// Common weak passwords to reject
const COMMON_PASSWORDS = [
  'password123', 'qwerty123', '123456789', 'password1', 'admin123',
  'letmein123', 'welcome123', 'abc123456', 'password12', 'iloveyou1',
  'azerty12345', 'motdepasse1', 'motdepasse!'
];

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
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: "Email requis" };
  }
  
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) {
    return { valid: false, error: "Email trop long" };
  }
  
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Format d'email invalide" };
  }
  
  return { valid: true };
}

/**
 * Validate password complexity
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ["Mot de passe requis"] };
  }
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`);
  }
  
  if (!PASSWORD_REQUIREMENTS.hasUppercase.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }
  
  if (!PASSWORD_REQUIREMENTS.hasLowercase.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }
  
  if (!PASSWORD_REQUIREMENTS.hasNumber.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }
  
  if (!PASSWORD_REQUIREMENTS.hasSpecial.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)");
  }
  
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.some(p => lowerPassword.includes(p))) {
    errors.push("Ce mot de passe est trop courant");
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Hash password using bcrypt with secure salt
 */
export async function hashPasswordSecure(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify password against stored hash (supports both bcrypt and SHA-256 migration)
 */
export async function verifyPasswordSecure(password: string, storedHash: string): Promise<{ valid: boolean; needsMigration: boolean }> {
  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (storedHash.startsWith('$2')) {
    try {
      const valid = await bcrypt.compare(password, storedHash);
      return { valid, needsMigration: false };
    } catch (e) {
      console.error('bcrypt compare error:', e);
      return { valid: false, needsMigration: false };
    }
  }
  
  // Legacy SHA-256 hash (64 character hex string)
  if (storedHash.length === 64 && /^[a-f0-9]+$/.test(storedHash)) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (sha256Hash === storedHash) {
      return { valid: true, needsMigration: true };
    }
  }
  
  return { valid: false, needsMigration: false };
}

/**
 * Validate a session token and optionally check for required roles
 */
export async function validateSession(
  sessionToken: string | undefined | null,
  options: ValidateSessionOptions = {}
): Promise<SessionValidationResult> {
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

    if (!user.is_active) {
      console.error('Session validation failed: account disabled');
      return {
        valid: false,
        error: 'Compte désactivé',
        status: 401,
      };
    }

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
        const roleMatch = options.requiredRoles!.includes(userRole.role);
        if (!roleMatch) return false;
        if (userRole.role === 'global_admin') return true;
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
 * Simple in-memory rate limiter (per function instance)
 * For production, use Redis/Upstash
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: new Date(now + windowMs) };
  }
  
  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: new Date(record.resetAt) };
  }
  
  record.count++;
  rateLimitStore.set(key, record);
  return { allowed: true, remaining: maxAttempts - record.count, resetAt: new Date(record.resetAt) };
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

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
    return [];
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
