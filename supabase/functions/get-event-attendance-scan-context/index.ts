import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  sessionCode: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionCode }: Body = await req.json();
    if (!sessionCode) {
      return new Response(JSON.stringify({ success: false, message: "Code de session requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("event_attendance_sessions")
      .select("id,event_id,school_id,session_code,expires_at,is_active")
      .eq("session_code", sessionCode)
      .eq("is_active", true)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ success: false, message: "Session invalide ou expirée" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(session.expires_at) < new Date()) {
      await supabaseAdmin.from("event_attendance_sessions").update({ is_active: false }).eq("id", session.id);
      return new Response(JSON.stringify({ success: false, message: "La session a expiré" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id,title,description,start_at,end_at,location,school_id")
      .eq("id", session.event_id)
      .single();

    if (eventError || !event) {
      return new Response(JSON.stringify({ success: false, message: "Événement non trouvé" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("id,name,logo_url")
      .eq("id", session.school_id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        session,
        event,
        school,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("get-event-attendance-scan-context error:", error);
    return new Response(JSON.stringify({ success: false, message: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
