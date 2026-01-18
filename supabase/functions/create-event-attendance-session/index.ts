import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  sessionToken: string;
  eventId: string;
  schoolId: string;
  expirationMinutes?: number;
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
    const { sessionToken, eventId, schoolId, expirationMinutes = 120 }: Body = await req.json();
    if (!sessionToken || !eventId || !schoolId) {
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

    if (!isAdminForSchool(rolesRes.roles, schoolId)) {
      return new Response(JSON.stringify({ success: false, message: "Accès interdit" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();

    const { data: session, error } = await supabaseAdmin
      .from("event_attendance_sessions")
      .insert({
        event_id: eventId,
        school_id: schoolId,
        session_code: sessionCode,
        expires_at: expiresAt,
        is_active: true,
      })
      .select("id,event_id,school_id,session_code,expires_at,is_active,created_at")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, session }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-event-attendance-session error:", error);
    return new Response(JSON.stringify({ success: false, message: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
