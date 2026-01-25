import { createClient } from "npm:@supabase/supabase-js@2";
import { validatePassword, hashPasswordSecure, checkRateLimit } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetPasswordRequest {
  token: string;
  password: string;
}

// Rate limit: 5 attempts per hour per token
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password }: SetPasswordRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`set-password:${token}`, MAX_ATTEMPTS, WINDOW_MS);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Trop de tentatives. Réessayez plus tard.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.errors.join('. ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Setting password with invitation token');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by invitation token
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('id, email, invitation_expires_at, is_active')
      .eq('invitation_token', token)
      .single();

    if (userError || !user) {
      console.error('Invalid token', userError);
      return new Response(
        JSON.stringify({ error: "Token invalide ou expiré" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (user.invitation_expires_at && new Date(user.invitation_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token invalide ou expiré" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await hashPasswordSecure(password);

    // Update user
    const { error: updateError } = await supabase
      .from('app_users')
      .update({
        password_hash: passwordHash,
        is_active: true,
        email_verified: true,
        invitation_token: null,
        invitation_expires_at: null,
        session_token: null,
        session_expires_at: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to set password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la définition du mot de passe' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Password set successfully for user: ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mot de passe mis à jour avec succès. Vous pouvez maintenant vous connecter.',
        email: user.email,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Set password error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
