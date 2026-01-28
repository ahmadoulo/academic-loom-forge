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
  <title>Connexion à votre compte EduVate</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 102, 204, 0.08); overflow: hidden;">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066cc 0%, #0080ff 50%, #00a3cc 100%); padding: 32px 32px 28px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 12px 20px; display: inline-block; margin-bottom: 12px;">
                      <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">EduVate</span>
                    </div>
                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 500;">Plateforme de gestion scolaire</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Success Icon & Title -->
          <tr>
            <td style="padding: 32px 32px 0; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 50%; padding: 16px; margin-bottom: 20px;">
                <div style="background: #10b981; border-radius: 50%; padding: 12px;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
              <h1 style="margin: 0 0 8px; color: #111827; font-size: 22px; font-weight: 700;">Connexion réussie</h1>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Une nouvelle connexion a été détectée</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 28px 32px;">
              <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour <strong style="color: #111827;">${firstName} ${lastName}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Une connexion à votre compte EduVate vient d'être effectuée.
              </p>
              
              <!-- Connection Details -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 14px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="32" valign="top">
                            <div style="background: #dbeafe; border-radius: 8px; padding: 6px; display: inline-block;">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="#2563eb" stroke-width="2"/>
                                <path d="M12 6V12L16 14" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
                              </svg>
                            </div>
                          </td>
                          <td style="padding-left: 12px;">
                            <p style="margin: 0 0 2px; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Date et heure</p>
                            <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">${loginTime}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 14px; border-top: 1px solid #e5e7eb; padding-top: 14px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="32" valign="top">
                            <div style="background: #fef3c7; border-radius: 8px; padding: 6px; display: inline-block;">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#d97706" stroke-width="2"/>
                                <circle cx="12" cy="10" r="3" stroke="#d97706" stroke-width="2"/>
                              </svg>
                            </div>
                          </td>
                          <td style="padding-left: 12px;">
                            <p style="margin: 0 0 2px; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Localisation</p>
                            <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">${location}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top: 1px solid #e5e7eb; padding-top: 14px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="32" valign="top">
                            <div style="background: #ede9fe; border-radius: 8px; padding: 6px; display: inline-block;">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="3" width="20" height="14" rx="2" stroke="#7c3aed" stroke-width="2"/>
                                <path d="M8 21H16" stroke="#7c3aed" stroke-width="2" stroke-linecap="round"/>
                                <path d="M12 17V21" stroke="#7c3aed" stroke-width="2" stroke-linecap="round"/>
                              </svg>
                            </div>
                          </td>
                          <td style="padding-left: 12px;">
                            <p style="margin: 0 0 2px; color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Adresse IP</p>
                            <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${ipAddress}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Security Warning -->
              <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 10px; padding: 14px 16px; border-left: 3px solid #f59e0b;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="20" valign="top">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9V13M12 17H12.01M12 3L2 21H22L12 3Z" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </td>
                    <td style="padding-left: 10px;">
                      <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                        <strong>Ce n'est pas vous ?</strong> Changez votre mot de passe immédiatement.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 6px; color: #6b7280; font-size: 12px;">
                      Notification automatique de sécurité
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
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
      timeStyle: "short",
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
      subject: "Nouvelle connexion à votre compte EduVate",
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
