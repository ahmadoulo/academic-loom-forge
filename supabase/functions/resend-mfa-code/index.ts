import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ResendMFARequest {
  userId: string;
  pendingSessionToken: string;
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
                    Voici votre nouveau code de vérification :
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
                    ⚠️ Si vous n'avez pas demandé ce code, ignorez cet email.
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

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, pendingSessionToken }: ResendMFARequest = await req.json();

    if (!userId || !pendingSessionToken) {
      return new Response(
        JSON.stringify({ error: "Paramètres manquants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from("app_users")
      .select("id, email, first_name, session_token, mfa_enabled")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify pending session
    if (user.session_token !== pendingSessionToken) {
      return new Response(
        JSON.stringify({ error: "Session invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user.mfa_enabled) {
      return new Response(
        JSON.stringify({ error: "MFA non activé pour cet utilisateur" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new MFA code
    const mfaCode = generateMFACode();
    const mfaCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new code
    await supabase
      .from("app_users")
      .update({
        mfa_code: mfaCode,
        mfa_code_expires_at: mfaCodeExpiresAt.toISOString(),
      })
      .eq("id", userId);

    // Send email
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromAddress = Deno.env.get("SMTP_FROM_ADDRESS");
    const smtpFromName = Deno.env.get("SMTP_FROM_NAME") || "EduVate";
    const smtpSecure = Deno.env.get("SMTP_SECURE") === "true";

    if (!smtpHost || !smtpUsername || !smtpPassword || !smtpFromAddress) {
      return new Response(
        JSON.stringify({ error: "Configuration SMTP manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transporter = nodemailer.createTransport({
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

    const htmlContent = createMFAEmailTemplate(user.first_name, mfaCode, 10);

    await transporter.sendMail({
      from: `"${smtpFromName}" <${smtpFromAddress}>`,
      to: user.email,
      subject: "🔐 Nouveau code de vérification - EduVate",
      text: `Votre code de vérification est : ${mfaCode}. Il expire dans 10 minutes.`,
      html: htmlContent,
    });

    transporter.close();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Un nouveau code a été envoyé à votre adresse email",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erreur lors de l'envoi du code" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
