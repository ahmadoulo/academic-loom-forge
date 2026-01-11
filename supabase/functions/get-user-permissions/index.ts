import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  sessionToken: string;
  schoolId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionToken, schoolId }: RequestBody = await req.json();

    if (!sessionToken || !schoolId) {
      return new Response(
        JSON.stringify({ success: false, error: 'sessionToken et schoolId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('id, is_active, session_expires_at')
      .eq('session_token', sessionToken)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Compte désactivé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (user.session_expires_at && new Date(user.session_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session expirée' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get role IDs assigned to this user in this school
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_school_roles')
      .select('school_role_id')
      .eq('user_id', user.id)
      .eq('school_id', schoolId);

    if (userRolesError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur roles utilisateur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const roleIds = (userRoles || []).map((r) => r.school_role_id).filter(Boolean);
    if (roleIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, permissions: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get permissions for those roles
    const { data: rolePermissions, error: permError } = await supabase
      .from('school_role_permissions')
      .select('permission_key')
      .in('role_id', roleIds);

    if (permError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur permissions roles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const permissions = [...new Set((rolePermissions || []).map((p) => p.permission_key).filter(Boolean))];

    return new Response(
      JSON.stringify({ success: true, permissions }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('get-user-permissions error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
