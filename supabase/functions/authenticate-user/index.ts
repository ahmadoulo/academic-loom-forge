import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  email: string;
  password: string;
}

interface UserRole {
  role: string;
  school_id: string | null;
}

// Hash password using SHA-256 (Web Crypto API - Deno compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password against stored hash
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // First try SHA-256 hash comparison
  const passwordHash = await hashPassword(password);
  if (passwordHash === storedHash) {
    return true;
  }
  
  // Fallback: check if stored hash is bcrypt format (starts with $2)
  if (storedHash.startsWith('$2')) {
    console.log('Detected bcrypt hash, needs migration');
    return false;
  }
  
  // For development/testing: allow plain text comparison
  if (storedHash === password) {
    return true;
  }
  
  return false;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password }: AuthRequest = await req.json();

    if (!email || !password) {
      console.error('Missing email or password');
      return new Response(
        JSON.stringify({ error: 'Email et mot de passe requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authentication attempt for: ${email}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user by email
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      console.error('User not found:', email);
      return new Response(
        JSON.stringify({ error: 'Email ou mot de passe incorrect' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      console.error('User account is inactive:', email);
      return new Response(
        JSON.stringify({ error: 'Compte inactif. Veuillez contacter l\'administrateur.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if password hash exists
    if (!user.password_hash) {
      console.error('No password set for user:', email);
      return new Response(
        JSON.stringify({ error: 'Compte en attente d\'activation. Vérifiez votre email.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      console.error('Invalid password for user:', email);
      return new Response(
        JSON.stringify({ error: 'Email ou mot de passe incorrect' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If password was validated but hash is old format, update it
    if (!user.password_hash.startsWith('$2') && user.password_hash !== await hashPassword(password)) {
      const newHash = await hashPassword(password);
      await supabase
        .from('app_users')
        .update({ password_hash: newHash })
        .eq('id', user.id);
      console.log('Password hash migrated to SHA-256');
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
    const { data: roles, error: rolesError } = await supabase
      .from('app_user_roles')
      .select('role, school_id')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Failed to fetch roles:', rolesError);
    }

    // Determine primary role for redirection
    const userRoles: UserRole[] = roles || [];
    let primaryRole = 'student';
    let primarySchoolId = user.school_id;

    // Priority: global_admin > admin > school_admin > school_staff > teacher > student
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

    // Fetch school identifier if there's a school_id
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

    console.log(`User ${email} authenticated successfully with role: ${primaryRole}, school identifier: ${primarySchoolIdentifier}`);

    // Return user data (without sensitive fields)
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
