import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  sessionCode: string;
  participantName: string;
  participantEmail: string | null;
  participantPhone: string | null;
  studentId: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionCode, participantName, participantEmail, participantPhone, studentId }: Body = await req.json();

    if (!sessionCode || !participantName) {
      return new Response(JSON.stringify({ success: false, message: "Paramètres manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("event_attendance_sessions")
      .select("id, event_id, school_id, expires_at, is_active")
      .eq("session_code", sessionCode)
      .eq("is_active", true)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ success: false, message: "Code QR invalide ou session expirée" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(session.expires_at) < new Date()) {
      // Best effort close
      await supabaseAdmin.from("event_attendance_sessions").update({ is_active: false }).eq("id", session.id);

      return new Response(JSON.stringify({ success: false, message: "La session a expiré" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Duplicate check
    if (studentId) {
      const { data: existing } = await supabaseAdmin
        .from("event_attendance")
        .select("id")
        .eq("event_id", session.event_id)
        .eq("student_id", studentId)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ success: false, message: "Vous avez déjà marqué votre présence pour cet événement" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (participantEmail) {
      const normalizedEmail = participantEmail.toLowerCase().trim();
      const { data: existing } = await supabaseAdmin
        .from("event_attendance")
        .select("id")
        .eq("event_id", session.event_id)
        .eq("participant_email", normalizedEmail)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ success: false, message: "Vous avez déjà marqué votre présence pour cet événement" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("event_attendance")
      .insert({
        event_id: session.event_id,
        session_id: session.id,
        school_id: session.school_id,
        participant_name: participantName,
        participant_email: participantEmail ? participantEmail.toLowerCase().trim() : null,
        participant_phone: participantPhone,
        student_id: studentId,
        method: "qr_scan",
      })
      .select("id,event_id,session_id,school_id,participant_name,participant_email,participant_phone,student_id,marked_at,method")
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, attendance: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("mark-event-attendance error:", error);
    return new Response(JSON.stringify({ success: false, message: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
