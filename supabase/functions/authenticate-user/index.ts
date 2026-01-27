import { createClient } from "npm:@supabase/supabase-js@2";
import { 
  validateEmail, 
  verifyPasswordSecure, 
  hashPasswordSecure,
  checkRateLimit,
  resetRateLimit
} from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
};

interface AuthRequest {
  email: string;
  password: string;
}

interface UserRole {
  role: string;
  school_id: string | null;
}

// Rate limit: 5 attempts per 15 minutes per email
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Helper to extract client IP from headers
function getClientIP(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'Inconnue';
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password }: AuthRequest = await req.json();

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return new Response(
        JSON.stringify({ error: emailValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Mot de passe requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting
    const rateLimit = checkRateLimit(`login:${normalizedEmail}`, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS);
    if (!rateLimit.allowed) {
      const waitMinutes = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000);
      return new Response(
        JSON.stringify({ 
          error: `Trop de tentatives. Réessayez dans ${waitMinutes} minute(s).` 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authentication attempt for: ${normalizedEmail}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user by email
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('id, email, password_hash, first_name, last_name, phone, avatar_url, school_id, teacher_id, student_id, is_active')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      console.error('User not found:', normalizedEmail);
      return new Response(
        JSON.stringify({ error: 'Email ou mot de passe incorrect' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user.is_active) {
      return new Response(
        JSON.stringify({ error: 'Compte inactif. Veuillez contacter l\'administrateur.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user.password_hash) {
      return new Response(
        JSON.stringify({ error: 'Compte en attente d\'activation. Vérifiez votre email.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password with bcrypt (with SHA-256 fallback for migration)
    const passwordResult = await verifyPasswordSecure(password, user.password_hash);

    if (!passwordResult.valid) {
      console.error('Invalid password for user:', normalizedEmail);
      return new Response(
        JSON.stringify({ error: 'Email ou mot de passe incorrect' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reset rate limit on successful login
    resetRateLimit(`login:${normalizedEmail}`);

    // Migrate password hash if using old SHA-256
    if (passwordResult.needsMigration) {
      console.log('Migrating password hash to bcrypt for:', normalizedEmail);
      const newHash = await hashPasswordSecure(password);
      await supabase
        .from('app_users')
        .update({ password_hash: newHash })
        .eq('id', user.id);
    }

    // Generate session token
    const sessionToken = crypto.randomUUID() + '-' + crypto.randomUUID();
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update user with session info
    const { error: updateError } = await supabase
      .from('app_users')
      .update({
        session_token: sessionToken,
        session_expires_at: sessionExpiresAt.toISOString(),
        last_login: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update session:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la connexion' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user roles
    const { data: roles } = await supabase
      .from('app_user_roles')
      .select('role, school_id')
      .eq('user_id', user.id);

    // Determine primary role
    const userRoles: UserRole[] = roles || [];
    let primaryRole = 'student';
    let primarySchoolId = user.school_id;

    const rolePriority = ['global_admin', 'admin', 'school_admin', 'school_staff', 'teacher', 'student'];
    for (const role of rolePriority) {
      const foundRole = userRoles.find(r => r.role === role);
      if (foundRole) {
        primaryRole = role;
        if (foundRole.school_id) {
          primarySchoolId = foundRole.school_id;
        }
        break;
      }
    }

    // Fetch school identifier
    let primarySchoolIdentifier: string | null = null;
    if (primarySchoolId) {
      const { data: school } = await supabase
        .from('schools')
        .select('identifier')
        .eq('id', primarySchoolId)
        .single();
      
      if (school) {
        primarySchoolIdentifier = school.identifier;
      }
    }

    console.log(`User ${normalizedEmail} authenticated successfully with role: ${primaryRole}`);

    // Get client IP for login notification
    const clientIP = getClientIP(req);
    
    // Send login notification email asynchronously (don't wait for it)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
    
    // Fire and forget - don't block login for email sending
    fetch(`${supabaseUrl}/functions/v1/send-login-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        ipAddress: clientIP,
      }),
    }).catch((err) => {
      console.error('Failed to send login notification:', err);
    });

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          school_id: user.school_id,
          teacher_id: user.teacher_id,
          student_id: user.student_id,
          is_active: user.is_active
        },
        roles: userRoles,
        primaryRole,
        primarySchoolId,
        primarySchoolIdentifier,
        sessionToken,
        sessionExpiresAt: sessionExpiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Authentication error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de l\'authentification' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
