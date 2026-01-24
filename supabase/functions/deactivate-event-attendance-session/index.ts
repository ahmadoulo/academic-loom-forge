import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  sessionToken: string;
  sessionId: string;
}

type AppRole = "global_admin" | "school_admin" | "teacher" | "student" | "parent";

async function getUserRoles(supabaseAdmin: any, sessionToken: string) {
  const { data: user, error: userError } = await supabaseAdmin
    .from("app_users")
    .select("id, is_active, session_expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (userError || !user) return { ok: false, status: 401, message: "Session invalide" } as const;
  if (!user.is_active) return { ok: false, status: 401, message: "Compte désactivé" } as const;
  if (user.session_expires_at && new Date(user.session_expires_at) < new Date()) {
    return { ok: false, status: 401, message: "Session expirée" } as const;
  }

  const { data: roles } = await supabaseAdmin
    .from("app_user_roles")
    .select("role, school_id")
    .eq("user_id", user.id);

  return { ok: true, roles: (roles || []) as { role: AppRole; school_id: string | null }[] } as const;
}

function isAdminForSchool(roles: { role: AppRole; school_id: string | null }[], schoolId: string) {
  return roles.some((r) => r.role === "global_admin" || (r.role === "school_admin" && r.school_id === schoolId));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionToken, sessionId }: Body = await req.json();
    if (!sessionToken || !sessionId) {
      return new Response(JSON.stringify({ success: false, message: "Paramètres manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const rolesRes = await getUserRoles(supabaseAdmin, sessionToken);
    if (!rolesRes.ok) {
      return new Response(JSON.stringify({ success: false, message: rolesRes.message }), {
        status: rolesRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("event_attendance_sessions")
      .select("id, school_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ success: false, message: "Session introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isAdminForSchool(rolesRes.roles, session.school_id)) {
      return new Response(JSON.stringify({ success: false, message: "Accès interdit" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabaseAdmin
      .from("event_attendance_sessions")
      .update({ is_active: false })
      .eq("id", sessionId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("deactivate-event-attendance-session error:", error);
    return new Response(JSON.stringify({ success: false, message: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
