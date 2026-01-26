import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.10";
import { validateEmail, checkRateLimit } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  appUrl?: string;
}

// Rate limit: 3 requests per hour per email
const MAX_REQUESTS = 3;
const WINDOW_MS = 60 * 60 * 1000;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, appUrl }: RequestBody = await req.json();

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: emailValidation.error }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting - return success to prevent email enumeration
    const rateLimit = checkRateLimit(`reset:${normalizedEmail}`, MAX_REQUESTS, WINDOW_MS);
    if (!rateLimit.allowed) {
      console.log("request-password-reset: Rate limit exceeded for:", normalizedEmail);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Si cet email existe, un lien de réinitialisation a été envoyé." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("request-password-reset: Processing for email:", normalizedEmail);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists in app_users
    const { data: user, error: userError } = await supabase
      .from("app_users")
      .select(
        "id, email, first_name, last_name, school_id, is_active, schools!app_users_school_id_fkey(name, identifier)"
      )
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userError) {
      console.error("request-password-reset: Error fetching user:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur lors de la vérification" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Always return success to prevent email enumeration
    if (!user || !user.is_active) {
      console.log("request-password-reset: User not found or inactive:", normalizedEmail);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Si cet email existe, un lien de réinitialisation a été envoyé." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    const resetExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    // Update user with reset token
    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        invitation_token: resetToken,
        invitation_expires_at: resetExpiresAt.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("request-password-reset: Error updating token:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur lors de la génération du lien" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get SMTP configuration
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromAddress = Deno.env.get("SMTP_FROM_ADDRESS");
    const smtpSecure = Deno.env.get("SMTP_SECURE") === "true";
    const smtpFromName = Deno.env.get("SMTP_FROM_NAME") || "EduVate";

    if (!smtpHost || !smtpUsername || !smtpPassword || !smtpFromAddress) {
      console.error("request-password-reset: SMTP not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Service email non configuré" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build reset URL
    const baseUrl =
      (appUrl && appUrl.startsWith("http") ? appUrl : undefined) ??
      req.headers.get("origin") ??
      Deno.env.get("SITE_URL") ??
      "https://eduvate.lovable.app";

    const resetUrl = `${baseUrl}/set-password?token=${resetToken}`;

    const schoolName = (user.schools as any)?.name || "votre etablissement";
    const schoolIdentifier = (user.schools as any)?.identifier || "";

    // Simple password reset email without school info
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reinitialisation de mot de passe</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                      <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">${smtpFromName}</h2>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 32px 32px 0;">
                      <h1 style="margin: 0 0 16px; color: #1e293b; font-size: 24px; font-weight: 700; line-height: 1.3;">Reinitialisation de mot de passe</h1>
                      <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">Bonjour ${user.first_name} ${user.last_name},</p>
                      <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                        Vous avez demande la reinitialisation de votre mot de passe pour votre compte.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 32px 32px; text-align: center;">
                      <a href="${resetUrl}" 
                         style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                        Reinitialiser mon mot de passe
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 32px 32px;">
                      <p style="margin: 0; color: #94a3b8; font-size: 13px; text-align: center;">
                        Ce lien est valable pendant 2 heures. Si vous n'avez pas demande cette reinitialisation, ignorez cet email.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 24px 32px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                        ${new Date().getFullYear()} ${smtpFromName} - Plateforme de gestion scolaire
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

    // Create SMTP transporter
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

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur de connexion au serveur email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email
    try {
      await transporter.sendMail({
        from: `"${smtpFromName}" <${smtpFromAddress}>`,
        to: user.email,
        subject: "Reinitialisation de votre mot de passe",
        html: emailHtml,
      });

      console.log("request-password-reset: Reset email sent to:", normalizedEmail);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Un email de réinitialisation a été envoyé à votre adresse." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("request-password-reset: Email send error:", emailError);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur lors de l'envoi de l'email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("request-password-reset: Unhandled error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Une erreur est survenue" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
