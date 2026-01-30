import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey =
  Deno.env.get("SUPABASE_ANON_KEY") ||
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VerifyMFARequest {
  userId: string;
  code: string;
  pendingSessionToken: string;
}

function getClientIP(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "Inconnue";
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, code, pendingSessionToken }: VerifyMFARequest = await req.json();

    if (!userId || !code || !pendingSessionToken) {
      return new Response(
        JSON.stringify({ error: "Paramètres manquants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user with MFA code
    const { data: user, error: userError } = await supabase
      .from("app_users")
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        avatar_url,
        school_id,
        teacher_id,
        student_id,
        is_active,
        mfa_code,
        mfa_code_expires_at,
        session_token
      `)
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify pending session token matches
    if (user.session_token !== pendingSessionToken) {
      return new Response(
        JSON.stringify({ error: "Session invalide. Veuillez vous reconnecter." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if MFA code exists and is not expired
    if (!user.mfa_code || !user.mfa_code_expires_at) {
      return new Response(
        JSON.stringify({ error: "Aucun code de vérification en attente" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const codeExpiresAt = new Date(user.mfa_code_expires_at);
    if (codeExpiresAt < new Date()) {
      // Clear expired code
      await supabase
        .from("app_users")
        .update({ mfa_code: null, mfa_code_expires_at: null })
        .eq("id", userId);

      return new Response(
        JSON.stringify({ error: "Code expiré. Veuillez vous reconnecter." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify code
    if (user.mfa_code !== code) {
      return new Response(
        JSON.stringify({ error: "Code de vérification incorrect" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Code is valid - generate final session token and clear MFA code
    const finalSessionToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await supabase
      .from("app_users")
      .update({
        session_token: finalSessionToken,
        session_expires_at: sessionExpiresAt.toISOString(),
        mfa_code: null,
        mfa_code_expires_at: null,
        last_login: new Date().toISOString(),
      })
      .eq("id", userId);

    // Fetch user roles
    const { data: roles } = await supabase
      .from("app_user_roles")
      .select("role, school_id")
      .eq("user_id", userId);

    const userRoles = roles || [];
    const rolePriority = [
      "global_admin",
      "admin",
      "school_admin",
      "school_staff",
      "teacher",
      "student",
    ];

    let primaryRole = "student";
    let primarySchoolId = user.school_id;

    for (const role of rolePriority) {
      const found = userRoles.find((r) => r.role === role);
      if (found) {
        primaryRole = role;
        primarySchoolId = found.school_id ?? primarySchoolId;
        break;
      }
    }

    let primarySchoolIdentifier: string | null = null;
    if (primarySchoolId) {
      const { data: school } = await supabase
        .from("schools")
        .select("identifier")
        .eq("id", primarySchoolId)
        .single();

      if (school) {
        primarySchoolIdentifier = school.identifier;
      }
    }

    // Send login notification
    const clientIP = getClientIP(req);
    fetch(`${supabaseUrl}/functions/v1/send-login-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        ipAddress: clientIP,
      }),
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        success: true,
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
          is_active: user.is_active,
        },
        roles: userRoles,
        primaryRole,
        primarySchoolId,
        primarySchoolIdentifier,
        sessionToken: finalSessionToken,
        sessionExpiresAt: sessionExpiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erreur lors de la vérification du code" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
