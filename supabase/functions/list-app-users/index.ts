import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  sessionToken: string;
  schoolId?: string; // Optional: filter by school
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json().catch(() => ({}));
    const { sessionToken, schoolId } = body;

    // SECURITY: Require session token
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentification requise" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session and get user
    const { data: currentUser, error: sessionError } = await supabase
      .from("app_users")
      .select("id, school_id, is_active, session_expires_at")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !currentUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Session invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check session expiry
    if (new Date(currentUser.session_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "Session expirée" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is active
    if (!currentUser.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: "Compte désactivé" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user roles
    const { data: userRoles } = await supabase
      .from("app_user_roles")
      .select("role, school_id")
      .eq("user_id", currentUser.id);

    const roles = userRoles || [];
    const isGlobalAdmin = roles.some(r => r.role === "global_admin");
    const isSchoolAdmin = roles.some(r => r.role === "school_admin");

    // Only global_admin and school_admin can list users
    if (!isGlobalAdmin && !isSchoolAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Permission refusée" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build query - include teacher_id and student_id for user type detection
    let query = supabase
      .from("app_users")
      .select(
        "id, email, first_name, last_name, school_id, is_active, created_at, last_login, teacher_id, student_id, app_user_roles!app_user_roles_user_id_fkey(role, school_id)"
      )
      .order("last_name", { ascending: true });

    // If school_admin (not global), only show users from their school(s)
    if (!isGlobalAdmin) {
      const adminSchoolIds = roles
        .filter(r => r.role === "school_admin" && r.school_id)
        .map(r => r.school_id);
      
      if (schoolId && adminSchoolIds.includes(schoolId)) {
        query = query.eq("school_id", schoolId);
      } else if (adminSchoolIds.length > 0) {
        query = query.in("school_id", adminSchoolIds);
      } else {
        // No school access
        return new Response(
          JSON.stringify({ success: true, users: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (schoolId) {
      // Global admin with school filter
      query = query.eq("school_id", schoolId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("list-app-users: query error", error);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur lors du chargement des utilisateurs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, users: data ?? [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("list-app-users: unhandled", e);
    return new Response(
      JSON.stringify({ success: false, error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
