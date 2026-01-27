import { createClient } from "npm:@supabase/supabase-js@2";
import {
  validateEmail,
  verifyPasswordSecure,
  hashPasswordSecure,
  checkRateLimit,
  resetRateLimit
} from "../_shared/auth.ts";

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/*                               ENV / CLIENT                                 */
/* -------------------------------------------------------------------------- */

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey =
  Deno.env.get("SUPABASE_ANON_KEY") ||
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface AuthRequest {
  email: string;
  password: string;
}

interface UserRole {
  role: string;
  school_id: string | null;
}

/* -------------------------------------------------------------------------- */
/*                                   UTILS                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                   HANDLER                                  */
/* -------------------------------------------------------------------------- */

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password }: AuthRequest = await req.json();

    /* ---------------------------- VALIDATION -------------------------------- */

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return new Response(
        JSON.stringify({ error: emailValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!password) {
      return new Response(
        JSON.stringify({ error: "Mot de passe requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    /* --------------------------- RATE LIMIT --------------------------------- */

    const rateLimit = checkRateLimit(
      `login:${normalizedEmail}`,
      MAX_LOGIN_ATTEMPTS,
      LOGIN_WINDOW_MS
    );

    if (!rateLimit.allowed) {
      const waitMinutes = Math.ceil(
        (rateLimit.resetAt.getTime() - Date.now()) / 60000
      );

      return new Response(
        JSON.stringify({
          error: `Trop de tentatives. Réessayez dans ${waitMinutes} minute(s).`,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authentication attempt for: ${normalizedEmail}`);

    /* ---------------------------- FETCH USER -------------------------------- */

    const { data: user, error: userError } = await supabase
      .from("app_users")
      .select(
        `
        id,
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        avatar_url,
        school_id,
        teacher_id,
        student_id,
        is_active
      `
      )
      .eq("email", normalizedEmail)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Email ou mot de passe incorrect" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user.is_active) {
      return new Response(
        JSON.stringify({
          error: "Compte inactif. Veuillez contacter l'administrateur.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user.password_hash) {
      return new Response(
        JSON.stringify({
          error: "Compte en attente d'activation. Vérifiez votre email.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /* -------------------------- PASSWORD CHECK ------------------------------ */

    const passwordResult = await verifyPasswordSecure(
      password,
      user.password_hash
    );

    if (!passwordResult.valid) {
      return new Response(
        JSON.stringify({ error: "Email ou mot de passe incorrect" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    resetRateLimit(`login:${normalizedEmail}`);

    if (passwordResult.needsMigration) {
      const newHash = await hashPasswordSecure(password);
      await supabase
        .from("app_users")
        .update({ password_hash: newHash })
        .eq("id", user.id);
    }

    /* --------------------------- SESSION ------------------------------------ */

    const sessionToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    const sessionExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await supabase
      .from("app_users")
      .update({
        session_token: sessionToken,
        session_expires_at: sessionExpiresAt.toISOString(),
        last_login: new Date().toISOString(),
      })
      .eq("id", user.id);

    /* ----------------------------- ROLES ------------------------------------ */

    const { data: roles } = await supabase
      .from("app_user_roles")
      .select("role, school_id")
      .eq("user_id", user.id);

    const userRoles: UserRole[] = roles || [];
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

    /* ----------------------- LOGIN NOTIFICATION ----------------------------- */

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
    }).catch((err) =>
      console.error("Failed to send login notification:", err)
    );

    /* ------------------------------ RESPONSE -------------------------------- */

    return new Response(
      JSON.stringify({
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
        sessionToken,
        sessionExpiresAt: sessionExpiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Authentication error:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur serveur lors de l'authentification",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
