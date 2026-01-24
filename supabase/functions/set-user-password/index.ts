import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetPasswordRequest {
  token: string;
  password: string;
}

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password }: SetPasswordRequest = await req.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: 'Token et mot de passe requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit contenir au moins 8 caractères' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Setting password with invitation token');

    // Create Supabase client with service role
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
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (new Date(user.invitation_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token invalide ou expiré" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash password (SHA-256)
    const passwordHash = await hashPassword(password);

    // Update user: works for BOTH activation (inactive account) and reset (active account)
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
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
