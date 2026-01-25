import { createClient } from "npm:@supabase/supabase-js@2";
import { 
  validatePassword, 
  hashPasswordSecure, 
  verifyPasswordSecure,
  validateSession,
  checkRateLimit 
} from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit: 3 attempts per hour per user
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, currentPassword, newPassword, sessionToken } = await req.json();

    if (!userId || !currentPassword || !newPassword || !sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Données manquantes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate session
    const session = await validateSession(sessionToken);
    if (!session.valid || session.userId !== userId) {
      return new Response(
        JSON.stringify({ error: session.error || 'Session invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`change-password:${userId}`, MAX_ATTEMPTS, WINDOW_MS);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Trop de tentatives. Réessayez dans une heure.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate new password complexity
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.errors.join('. ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current password hash
    const { data: sessionUser, error: sessionError } = await supabase
      .from('app_users')
      .select('id, password_hash')
      .eq('id', userId)
      .single();

    if (sessionError || !sessionUser) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify current password
    const currentPasswordResult = await verifyPasswordSecure(currentPassword, sessionUser.password_hash);
    if (!currentPasswordResult.valid) {
      return new Response(
        JSON.stringify({ error: 'Mot de passe actuel incorrect' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash new password with bcrypt
    const newPasswordHash = await hashPasswordSecure(newPassword);

    // Update password
    const { error: updateError } = await supabase
      .from('app_users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la mise à jour du mot de passe' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mot de passe modifié avec succès'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Change password error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
