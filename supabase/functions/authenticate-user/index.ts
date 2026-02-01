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
const MFA_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

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

function generateMFACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createMFAEmailTemplate(
  firstName: string,
  code: string,
  expiresInMinutes: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Code de vérification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">🔐 Vérification de connexion</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 32px; text-align: center;">
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    Bonjour <strong>${firstName}</strong>,
                  </p>
                  
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    Une tentative de connexion a été détectée sur votre compte. Voici votre code de vérification :
                  </p>

                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8; font-family: monospace;">
                      ${code}
                    </span>
                  </div>

                  <p style="color: #64748b; font-size: 14px; margin: 0;">
                    ⏱️ Ce code expire dans <strong>${expiresInMinutes} minutes</strong>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background-color: #fef3c7; padding: 16px 32px; border-top: 1px solid #fcd34d;">
                  <p style="color: #92400e; font-size: 13px; margin: 0; text-align: center;">
                    ⚠️ Si vous n'avez pas initié cette connexion, ignorez cet email et sécurisez votre compte.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background-color: #f1f5f9; padding: 24px; text-align: center;">
                  <p style="color: #64748b; font-size: 12px; margin: 0;">
                    EduVate - Plateforme de gestion scolaire
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

async function sendMFAEmail(
  email: string,
  firstName: string,
  code: string
): Promise<boolean> {
  try {
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromAddress = Deno.env.get("SMTP_FROM_ADDRESS");
    const smtpFromName = Deno.env.get("SMTP_FROM_NAME") || "EduVate";
    const smtpSecure = Deno.env.get("SMTP_SECURE") === "true";

    if (!smtpHost || !smtpUsername || !smtpPassword || !smtpFromAddress) {
      console.error("SMTP configuration missing");
      return false;
    }

    // Dynamic import nodemailer inside the function to avoid boot issues
    const nodemailer = await import("npm:nodemailer@6.9.10");

    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const htmlContent = createMFAEmailTemplate(firstName, code, 10);

    await transporter.sendMail({
      from: `"${smtpFromName}" <${smtpFromAddress}>`,
      to: email,
      subject: "🔐 Code de vérification - EduVate",
      text: `Votre code de vérification est : ${code}. Il expire dans 10 minutes.`,
      html: htmlContent,
    });

    transporter.close();
    return true;
  } catch (error) {
    console.error("Error sending MFA email:", error);
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   HANDLER                                  */
/* -------------------------------------------------------------------------- */

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client INSIDE the handler
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Configuration serveur manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        is_active,
        mfa_enabled,
        mfa_type
      `
      )
      .eq("email", normalizedEmail)
      .single();

    if (userError || !user) {
      console.log("User not found for email:", normalizedEmail);
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

    console.log("Verifying password for user:", user.id);
    const passwordResult = await verifyPasswordSecure(
      password,
      user.password_hash
    );

    if (!passwordResult.valid) {
      console.log("Password verification failed for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Email ou mot de passe incorrect" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Password verified successfully for user:", user.id);
    resetRateLimit(`login:${normalizedEmail}`);

    if (passwordResult.needsMigration) {
      console.log("Migrating password hash for user:", user.id);
      const newHash = await hashPasswordSecure(password);
      await supabase
        .from("app_users")
        .update({ password_hash: newHash })
        .eq("id", user.id);
    }

    /* --------------------------- MFA CHECK ---------------------------------- */

    if (user.mfa_enabled && user.mfa_type === "email") {
      // Generate MFA code
      const mfaCode = generateMFACode();
      const mfaCodeExpiresAt = new Date(Date.now() + MFA_CODE_EXPIRY_MS);

      // Create a pending session token
      const pendingSessionToken = crypto.randomUUID() + "-" + crypto.randomUUID();
      const sessionExpiresAt = new Date(Date.now() + MFA_CODE_EXPIRY_MS);

      // Store MFA code and pending session
      await supabase
        .from("app_users")
        .update({
          mfa_code: mfaCode,
          mfa_code_expires_at: mfaCodeExpiresAt.toISOString(),
          session_token: pendingSessionToken,
          session_expires_at: sessionExpiresAt.toISOString(),
        })
        .eq("id", user.id);

      // Send MFA code via email
      const emailSent = await sendMFAEmail(user.email, user.first_name, mfaCode);

      if (!emailSent) {
        return new Response(
          JSON.stringify({ error: "Erreur lors de l'envoi du code de vérification" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return MFA required response
      return new Response(
        JSON.stringify({
          mfaRequired: true,
          userId: user.id,
          pendingSessionToken,
          message: "Un code de vérification a été envoyé à votre adresse email",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Fire and forget - don't await
    if (supabaseAnonKey) {
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
      }).catch((e) => console.error("Failed to send login notification:", e));
    }

    /* ------------------------------ RESPONSE -------------------------------- */

    console.log("Login successful for user:", user.id);

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
          mfa_enabled: user.mfa_enabled,
          mfa_type: user.mfa_type,
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
