import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  schoolId: string;
  email: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { schoolId, email }: Body = await req.json();
    if (!schoolId || !email) {
      return new Response(JSON.stringify({ success: false, message: "Paramètres manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Find a student enrolled in this school with this email
    const { data, error } = await supabaseAdmin
      .from("student_school")
      .select("students!inner(id, firstname, lastname, email)")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .eq("students.email", normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    const student = (data as any)?.students;
    if (!student) {
      return new Response(JSON.stringify({ success: false, message: "Email d'étudiant non trouvé dans cette école" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, student }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("find-student-by-email error:", error);
    return new Response(JSON.stringify({ success: false, message: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
