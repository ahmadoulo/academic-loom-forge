import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginNotificationRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  ipAddress?: string;
}

interface GeoData {
  country?: string;
  city?: string;
  region?: string;
}

async function getGeoLocation(ip: string): Promise<GeoData> {
  try {
    // Skip geolocation for private/local IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
      return { country: "Réseau local", city: "", region: "" };
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
    if (!response.ok) {
      return { country: "Inconnu", city: "", region: "" };
    }

    const data = await response.json();
    if (data.status === "success") {
      return {
        country: data.country || "Inconnu",
        city: data.city || "",
        region: data.regionName || "",
      };
    }
    return { country: "Inconnu", city: "", region: "" };
  } catch (error) {
    console.error("Geolocation error:", error);
    return { country: "Inconnu", city: "", region: "" };
  }
}

function formatLocation(geo: GeoData): string {
  const parts = [geo.city, geo.region, geo.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Localisation inconnue";
}

function getEmailTemplate(
  firstName: string,
  lastName: string,
  ipAddress: string,
  location: string,
  loginTime: string
): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle connexion à votre compte</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0080ff 0%, #00a3cc 100%); padding: 40px 40px 30px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 16px; padding: 16px; margin-bottom: 16px;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">EduVate</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Plateforme de gestion scolaire</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 50%; padding: 20px; margin-bottom: 16px;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h2 style="margin: 0 0 8px; color: #1a1a2e; font-size: 24px; font-weight: 700;">Connexion réussie</h2>
                <p style="margin: 0; color: #64748b; font-size: 15px;">Une nouvelle connexion a été détectée sur votre compte</p>
              </div>
              
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Bonjour <strong style="color: #1a1a2e;">${firstName} ${lastName}</strong>,
              </p>
              
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Nous vous informons qu'une connexion à votre compte EduVate a été effectuée avec succès. Voici les détails de cette connexion :
              </p>
              
              <!-- Connection Details Box -->
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="40" valign="top">
                            <div style="background: #e0f2fe; border-radius: 8px; padding: 8px; display: inline-block;">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="#0284c7" stroke-width="2"/>
                                <path d="M12 6V12L16 14" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/>
                              </svg>
                            </div>
                          </td>
                          <td style="padding-left: 16px;">
                            <p style="margin: 0 0 4px; color: #64748b; font-size: 13px; font-weight: 500;">Date et heure</p>
                            <p style="margin: 0; color: #1e293b; font-size: 15px; font-weight: 600;">${loginTime}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="40" valign="top">
                            <div style="background: #fef3c7; border-radius: 8px; padding: 8px; display: inline-block;">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#d97706" stroke-width="2"/>
                                <circle cx="12" cy="10" r="3" stroke="#d97706" stroke-width="2"/>
                              </svg>
                            </div>
                          </td>
                          <td style="padding-left: 16px;">
                            <p style="margin: 0 0 4px; color: #64748b; font-size: 13px; font-weight: 500;">Localisation</p>
                            <p style="margin: 0; color: #1e293b; font-size: 15px; font-weight: 600;">${location}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="40" valign="top">
                            <div style="background: #ede9fe; border-radius: 8px; padding: 8px; display: inline-block;">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="3" width="20" height="14" rx="2" stroke="#7c3aed" stroke-width="2"/>
                                <path d="M8 21H16" stroke="#7c3aed" stroke-width="2" stroke-linecap="round"/>
                                <path d="M12 17V21" stroke="#7c3aed" stroke-width="2" stroke-linecap="round"/>
                              </svg>
                            </div>
                          </td>
                          <td style="padding-left: 16px;">
                            <p style="margin: 0 0 4px; color: #64748b; font-size: 13px; font-weight: 500;">Adresse IP</p>
                            <p style="margin: 0; color: #1e293b; font-size: 15px; font-weight: 600; font-family: 'SF Mono', Monaco, monospace;">${ipAddress}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Security Notice -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="24" valign="top">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9V13M12 17H12.01M12 3L2 21H22L12 3Z" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </td>
                    <td style="padding-left: 12px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                        <strong>Ce n'est pas vous ?</strong> Si vous n'êtes pas à l'origine de cette connexion, veuillez changer votre mot de passe immédiatement et contacter l'administrateur de votre établissement.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                Cet email a été envoyé automatiquement pour votre sécurité. Vous recevez cette notification à chaque connexion à votre compte.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px; color: #1e293b; font-size: 14px; font-weight: 600;">EduVate</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      Votre plateforme de gestion scolaire
                    </p>
                    <p style="margin: 16px 0 0; color: #94a3b8; font-size: 11px;">
                      © ${new Date().getFullYear()} EduVate. Tous droits réservés.
                    </p>
                  </td>
                </tr>
              </table>
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, firstName, lastName, ipAddress }: LoginNotificationRequest = await req.json();

    if (!userId || !email || !firstName || !lastName) {
      console.error("send-login-notification: Missing required fields");
      return new Response(
        JSON.stringify({ success: false, error: "Données manquantes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`send-login-notification: Sending notification to ${email} from IP ${ipAddress || "unknown"}`);

    // Get geolocation data
    const ip = ipAddress || "Inconnue";
    const geoData = ip !== "Inconnue" ? await getGeoLocation(ip) : { country: "Inconnu", city: "", region: "" };
    const location = formatLocation(geoData);

    // Format login time
    const loginTime = new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "medium",
      timeZone: "Africa/Casablanca",
    }).format(new Date());

    // Get SMTP configuration
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromAddress = Deno.env.get("SMTP_FROM_ADDRESS");
    const smtpSecure = Deno.env.get("SMTP_SECURE") === "true";
    const smtpFromName = Deno.env.get("SMTP_FROM_NAME") || "EduVate";

    if (!smtpHost || !smtpUsername || !smtpPassword || !smtpFromAddress) {
      console.error("send-login-notification: SMTP not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Configuration SMTP manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create transporter
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

    // Generate email content
    const htmlContent = getEmailTemplate(firstName, lastName, ip, location, loginTime);

    // Send email
    const mailOptions = {
      from: `"${smtpFromName}" <${smtpFromAddress}>`,
      to: email,
      subject: "🔐 Nouvelle connexion à votre compte EduVate",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    console.log(`send-login-notification: Email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-login-notification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erreur lors de l'envoi de la notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
