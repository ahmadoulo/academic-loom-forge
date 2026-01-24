import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  sessionToken: string;
  eventId: string;
}

type AppRole = "global_admin" | "school_admin" | "teacher" | "student" | "parent";

async function getUserContext(supabaseAdmin: any, sessionToken: string) {
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

  return { ok: true, userId: user.id, roles: (roles || []) as { role: AppRole; school_id: string | null }[] } as const;
}

function isAdminForSchool(roles: { role: AppRole; school_id: string | null }[], schoolId: string) {
  return roles.some((r) => r.role === "global_admin" || (r.role === "school_admin" && r.school_id === schoolId));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionToken, eventId }: Body = await req.json();
    if (!sessionToken || !eventId) {
      return new Response(JSON.stringify({ success: false, message: "Paramètres manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const ctx = await getUserContext(supabaseAdmin, sessionToken);
    if (!ctx.ok) {
      return new Response(JSON.stringify({ success: false, message: ctx.message }), {
        status: ctx.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, school_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return new Response(JSON.stringify({ success: false, message: "Événement introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isAdminForSchool(ctx.roles, event.school_id)) {
      return new Response(JSON.stringify({ success: false, message: "Accès interdit" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: attendance, error } = await supabaseAdmin
      .from("event_attendance")
      .select(
        "id,event_id,session_id,school_id,participant_name,participant_email,participant_phone,student_id,marked_at,method,students(id, firstname, lastname, email)"
      )
      .eq("event_id", eventId)
      .order("marked_at", { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, attendance: attendance || [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-event-attendance error:", error);
    return new Response(JSON.stringify({ success: false, message: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
