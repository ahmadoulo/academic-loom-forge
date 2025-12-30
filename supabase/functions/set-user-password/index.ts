import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetPasswordRequest {
  token: string;
  password: string;
}

serve(async (req) => {
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
      console.error('Invalid invitation token');
      return new Response(
        JSON.stringify({ error: 'Token d\'invitation invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (new Date(user.invitation_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Le token d\'invitation a expiré. Contactez votre administrateur.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if account is already active
    if (user.is_active) {
      return new Response(
        JSON.stringify({ error: 'Ce compte est déjà activé. Utilisez la page de connexion.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password);

    // Update user
    const { error: updateError } = await supabase
      .from('app_users')
      .update({
        password_hash: passwordHash,
        is_active: true,
        email_verified: true,
        invitation_token: null,
        invitation_expires_at: null
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
        message: 'Mot de passe défini avec succès. Vous pouvez maintenant vous connecter.',
        email: user.email
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
