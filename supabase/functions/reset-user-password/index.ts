import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  userId: string;
  requestedBy: string; // ID of the admin requesting the reset
}

// Hash password using SHA-256 (Deno compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, requestedBy }: ResetPasswordRequest = await req.json();

    if (!userId || !requestedBy) {
      return new Response(
        JSON.stringify({ error: 'userId et requestedBy sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Password reset requested for user: ${userId} by: ${requestedBy}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user has permission
    const { data: requester } = await supabase
      .from('app_users')
      .select('id, school_id')
      .eq('id', requestedBy)
      .single();

    if (!requester) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non autorisé' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch requester's roles
    const { data: requesterRoles } = await supabase
      .from('app_user_roles')
      .select('role, school_id')
      .eq('user_id', requestedBy);

    const isGlobalAdmin = requesterRoles?.some(r => r.role === 'global_admin' || r.role === 'admin');
    const isSchoolAdmin = requesterRoles?.some(r => r.role === 'school_admin');

    if (!isGlobalAdmin && !isSchoolAdmin) {
      return new Response(
        JSON.stringify({ error: 'Permissions insuffisantes' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch target user
    const { data: targetUser, error: targetError } = await supabase
      .from('app_users')
      .select('id, email, school_id')
      .eq('id', userId)
      .single();

    if (targetError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // School admins can only reset passwords for users in their school
    if (isSchoolAdmin && !isGlobalAdmin) {
      const adminSchoolId = requesterRoles?.find(r => r.role === 'school_admin')?.school_id;
      if (targetUser.school_id !== adminSchoolId) {
        return new Response(
          JSON.stringify({ error: 'Vous ne pouvez réinitialiser que les mots de passe de votre école' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate new password
    const newPassword = generatePassword();
    const passwordHash = await hashPassword(newPassword);

    // Update user password and invalidate sessions
    const { error: updateError } = await supabase
      .from('app_users')
      .update({
        password_hash: passwordHash,
        session_token: null,
        session_expires_at: null,
        is_active: true // Ensure account is active after reset
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la réinitialisation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Password reset successful for user: ${targetUser.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        newPassword, // Return password to be copied to clipboard
        message: 'Mot de passe réinitialisé avec succès'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
