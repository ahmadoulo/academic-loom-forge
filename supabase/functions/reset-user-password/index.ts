import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  handleCors,
  validateSession,
  isGlobalAdmin,
  isSchoolAdmin,
  errorResponse,
} from "../_shared/auth.ts";

interface ResetPasswordRequest {
  sessionToken: string; // Required for authentication
  userId: string;
  newPassword?: string; // If not provided, generate random password
}

// Hash password using SHA-256 (Deno compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a random password
function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body: ResetPasswordRequest = await req.json();
    const { sessionToken, userId, newPassword } = body;

    // ============================================================
    // SECURITY: Validate session - only admins can reset passwords
    // ============================================================
    const session = await validateSession(sessionToken, {
      requiredRoles: ['global_admin', 'school_admin'],
    });

    if (!session.valid) {
      console.error('Session validation failed:', session.error);
      return errorResponse(session.error || 'Non autorisé', session.status || 401);
    }

    if (!userId) {
      return errorResponse('ID utilisateur requis', 400);
    }

    console.log(`Admin ${session.userId} resetting password for user ${userId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get target user to check permissions
    const { data: targetUser, error: userError } = await supabase
      .from('app_users')
      .select('id, email, school_id')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return errorResponse('Utilisateur non trouvé', 404);
    }

    // Check if admin has permission to reset this user's password
    if (!isGlobalAdmin(session.roles || [])) {
      if (targetUser.school_id && !isSchoolAdmin(session.roles || [], targetUser.school_id)) {
        return errorResponse('Vous ne pouvez réinitialiser que les mots de passe des utilisateurs de vos écoles', 403);
      }
    }

    // Generate or use provided password
    const password = newPassword || generateRandomPassword();
    const passwordHash = await hashPassword(password);

    // Update password and invalidate current session
    const { error: updateError } = await supabase
      .from('app_users')
      .update({
        password_hash: passwordHash,
        session_token: null,
        session_expires_at: null,
        is_active: true, // Ensure account is active after reset
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to reset password:', updateError);
      return errorResponse('Erreur lors de la réinitialisation du mot de passe', 500);
    }

    console.log(`Password reset successfully for user ${targetUser.email} by admin ${session.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        newPassword: password, // Return password to be copied to clipboard
        message: 'Mot de passe réinitialisé avec succès',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse('Erreur serveur', 500);
  }
});
