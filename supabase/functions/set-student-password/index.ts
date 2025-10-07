import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetPasswordRequest {
  token: string;
  password: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, password }: SetPasswordRequest = await req.json();

    console.log('🔐 Set password request received');
    console.log('🔍 Token length:', token?.length);

    if (!token || !password) {
      console.error('❌ Missing token or password');
      return new Response(
        JSON.stringify({ error: 'Token et mot de passe requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      console.error('❌ Password too short');
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit contenir au moins 8 caractères' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer un client Supabase avec le service role key (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Nettoyer le token
    const cleanToken = token.trim();

    // Vérifier le token et récupérer le compte
    console.log('🔍 Checking token in database...');
    const { data: account, error: fetchError } = await supabaseAdmin
      .from('student_accounts')
      .select('id, email, student_id, school_id, invitation_token, invitation_expires_at, is_active, password_hash')
      .eq('invitation_token', cleanToken)
      .maybeSingle();

    console.log('📥 Account lookup result:', { 
      accountFound: !!account, 
      accountId: account?.id,
      isActive: account?.is_active,
      hasPassword: !!account?.password_hash,
      hasExpiration: !!account?.invitation_expires_at,
      fetchError 
    });

    if (fetchError) {
      console.error('❌ Database error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la validation du token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!account) {
      console.error('❌ No account found with this token');
      return new Response(
        JSON.stringify({ error: 'Token d\'invitation invalide' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si le compte est déjà actif
    if (account.is_active && account.password_hash) {
      console.log('✅ Account already active');
      return new Response(
        JSON.stringify({ error: 'Ce compte est déjà actif' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier l'expiration du token
    if (!account.invitation_expires_at) {
      console.error('❌ No expiration date');
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expiresAt = new Date(account.invitation_expires_at);
    const now = new Date();

    console.log('📅 Expiration check:', { 
      expiresAt: expiresAt.toISOString(), 
      now: now.toISOString(), 
      isExpired: now > expiresAt
    });

    if (now > expiresAt) {
      console.error('❌ Token expired');
      return new Response(
        JSON.stringify({ error: 'Le lien d\'invitation a expiré. Demandez un nouveau lien.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hasher le mot de passe avec bcrypt
    console.log('🔐 Hashing password with bcrypt...');
    const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts');
    const passwordHash = await bcrypt.hash(password);
    console.log('✅ Password hashed with bcrypt');

    // Mettre à jour le compte (avec service role, bypass RLS)
    console.log('💾 Updating account...');
    const { error: updateError } = await supabaseAdmin
      .from('student_accounts')
      .update({
        password_hash: passwordHash,
        is_active: true,
        invitation_token: null,
        invitation_expires_at: null
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return new Response(
        JSON.stringify({ error: `Erreur lors de la mise à jour: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que la mise à jour a bien été effectuée
    console.log('🔍 Verifying update...');
    const { data: verifyAccount, error: verifyError } = await supabaseAdmin
      .from('student_accounts')
      .select('id, email, is_active, password_hash')
      .eq('id', account.id)
      .maybeSingle();

    console.log('✅ Verification result:', {
      found: !!verifyAccount,
      isActive: verifyAccount?.is_active,
      hasPassword: !!verifyAccount?.password_hash,
      verifyError
    });

    if (!verifyAccount || !verifyAccount.is_active || !verifyAccount.password_hash) {
      console.error('❌ Update verification failed');
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification de la mise à jour' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Password set successfully for account:', account.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mot de passe défini avec succès',
        email: account.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
