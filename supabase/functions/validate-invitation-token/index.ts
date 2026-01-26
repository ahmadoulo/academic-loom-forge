import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateTokenRequest {
  token: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: ValidateTokenRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanToken = token.trim();
    console.log('🔍 Validating invitation token...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Find user by invitation token using service role (bypasses RLS)
    const { data: account, error } = await supabase
      .from('app_users')
      .select('id, email, invitation_expires_at, password_hash, is_active')
      .eq('invitation_token', cleanToken)
      .maybeSingle();

    if (error) {
      console.error('❌ Database error:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Erreur de validation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!account) {
      console.log('❌ No account found with this token');
      return new Response(
        JSON.stringify({ valid: false, error: 'Token invalide ou expiré' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For password reset, the account being active is expected
    // We only reject if there's no password hash AND the account is active (shouldn't happen)
    // But for reset flow, we allow active accounts with password to proceed
    console.log('📋 Account status:', { is_active: account.is_active, has_password: !!account.password_hash });

    // Check expiration
    if (!account.invitation_expires_at) {
      console.log('❌ No expiration date set');
      return new Response(
        JSON.stringify({ valid: false, error: 'Token invalide' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expiresAt = new Date(account.invitation_expires_at);
    const now = new Date();

    if (now > expiresAt) {
      console.log('❌ Token expired:', { expiresAt: expiresAt.toISOString(), now: now.toISOString() });
      return new Response(
        JSON.stringify({ valid: false, error: 'Lien expiré. Demandez un nouveau lien.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Token is valid for:', account.email);

    // Determine mode based on whether password was already set
    const mode = account.password_hash ? 'reset' : 'activation';

    return new Response(
      JSON.stringify({ 
        valid: true, 
        mode,
        email: account.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
