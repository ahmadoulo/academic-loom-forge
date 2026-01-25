import { createClient } from "npm:@supabase/supabase-js@2";
import { 
  validatePassword, 
  hashPasswordSecure, 
  checkRateLimit,
  corsHeaders 
} from "../_shared/auth.ts";

interface SetPasswordRequest {
  token: string;
  password: string; // Now accepts plain password, not pre-hashed
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

    console.log('🔐 Set student password request received');

    if (!token || !password) {
      console.error('❌ Missing token or password');
      return new Response(
        JSON.stringify({ error: 'Token et mot de passe requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting per token
    const rateLimit = checkRateLimit(`set-student-password:${token}`, MAX_ATTEMPTS, WINDOW_MS);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Trop de tentatives. Réessayez plus tard.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password complexity on server
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.error('❌ Password validation failed:', passwordValidation.errors);
      return new Response(
        JSON.stringify({ error: passwordValidation.errors.join('. ') }),
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

    if (now > expiresAt) {
      console.error('❌ Token expired');
      return new Response(
        JSON.stringify({ error: 'Le lien d\'invitation a expiré. Demandez un nouveau lien.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash password server-side with bcrypt
    console.log('💾 Hashing password with bcrypt...');
    const passwordHash = await hashPasswordSecure(password);

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
