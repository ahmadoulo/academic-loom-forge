import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateRequest {
  sessionToken: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionToken }: ValidateRequest = await req.json();

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token de session requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user by session token
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Session invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is expired
    if (new Date(user.session_expires_at) < new Date()) {
      // Clear expired session
      await supabase
        .from('app_users')
        .update({ session_token: null, session_expires_at: null })
        .eq('id', user.id);

      return new Response(
        JSON.stringify({ valid: false, error: 'Session expirée' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is still active
    if (!user.is_active) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Compte désactivé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh session if it expires in less than 1 day
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    let newSessionToken = sessionToken;
    let newSessionExpiresAt = user.session_expires_at;

    if (new Date(user.session_expires_at) < oneDayFromNow) {
      newSessionToken = crypto.randomUUID() + '-' + crypto.randomUUID();
      newSessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await supabase
        .from('app_users')
        .update({
          session_token: newSessionToken,
          session_expires_at: newSessionExpiresAt
        })
        .eq('id', user.id);
    }

    // Fetch user roles
    const { data: roles } = await supabase
      .from('app_user_roles')
      .select('role, school_id')
      .eq('user_id', user.id);

    // Determine primary role
    const userRoles = roles || [];
    let primaryRole = 'student';
    let primarySchoolId = user.school_id;

    const rolePriority = ['global_admin', 'admin', 'school_admin', 'school_staff', 'teacher', 'student'];
    for (const role of rolePriority) {
      const foundRole = userRoles.find((r: { role: string }) => r.role === role);
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

    return new Response(
      JSON.stringify({
        valid: true,
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
        sessionToken: newSessionToken,
        sessionExpiresAt: newSessionExpiresAt
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Session validation error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
