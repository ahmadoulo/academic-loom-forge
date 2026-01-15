import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRecipient {
  email: string;
  name: string;
  type: 'student' | 'parent';
  missingDocuments: string[];
}

interface SMTPNotificationRequest {
  recipients: NotificationRecipient[];
  schoolId: string;
  schoolName: string;
  className: string;
}

const createEmailTemplate = (
  recipientName: string,
  recipientType: 'student' | 'parent',
  schoolName: string,
  schoolLogo: string | null,
  className: string,
  missingDocuments: string[]
): string => {
  const isParent = recipientType === 'parent';
  const greeting = isParent 
    ? `Cher(e) Parent/Tuteur de ${recipientName}`
    : `Cher(e) ${recipientName}`;
  
  const intro = isParent
    ? `Nous vous informons que le dossier administratif de votre enfant inscrit en classe de <strong>${className}</strong> est incomplet.`
    : `Nous vous informons que votre dossier administratif pour la classe <strong>${className}</strong> est incomplet.`;

  const documentsList = missingDocuments.map(doc => `<li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${doc}</li>`).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rappel - Documents Administratifs</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
                  ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" style="max-height: 60px; margin-bottom: 16px;">` : ''}
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${schoolName}</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 24px 0; font-weight: 600;">
                    📋 Rappel - Documents Administratifs Manquants
                  </h2>
                  
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    ${greeting},
                  </p>
                  
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    ${intro}
                  </p>

                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
                      ⚠️ Veuillez fournir les documents suivants dans les plus brefs délais :
                    </p>
                  </div>

                  <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">
                      Documents manquants (${missingDocuments.length})
                    </h3>
                    <ul style="margin: 0; padding: 0; list-style: none;">
                      ${documentsList}
                    </ul>
                  </div>

                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    Nous vous prions de bien vouloir transmettre ces documents à l'administration de l'établissement ou de les déposer directement au secrétariat.
                  </p>

                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
                    Pour toute question, n'hésitez pas à nous contacter.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">
                    Cordialement,
                  </p>
                  <p style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0;">
                    L'Administration de ${schoolName}
                  </p>
                  <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0 0;">
                    Ce message a été envoyé automatiquement. Merci de ne pas y répondre directement.
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
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, schoolId, schoolName, className }: SMTPNotificationRequest = await req.json();

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get SMTP configuration from environment
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromAddress = Deno.env.get("SMTP_FROM_ADDRESS");
    const smtpFromName = Deno.env.get("SMTP_FROM_NAME") || schoolName;
    const smtpSecure = Deno.env.get("SMTP_SECURE") === "true";

    if (!smtpHost || !smtpUsername || !smtpPassword || !smtpFromAddress) {
      console.error("Missing SMTP configuration");
      return new Response(
        JSON.stringify({ error: "SMTP configuration is incomplete" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client to get school logo
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get school logo
    let schoolLogo: string | null = null;
    const { data: schoolData } = await supabase
      .from("schools")
      .select("logo_url")
      .eq("id", schoolId)
      .single();

    if (schoolData?.logo_url) {
      schoolLogo = schoolData.logo_url;
    }

    // Initialize SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: smtpSecure,
        auth: {
          username: smtpUsername,
          password: smtpPassword,
        },
      },
    });

    const results: { email: string; success: boolean; error?: string }[] = [];

    // Send emails to each recipient
    for (const recipient of recipients) {
      try {
        const htmlContent = createEmailTemplate(
          recipient.name,
          recipient.type,
          schoolName,
          schoolLogo,
          className,
          recipient.missingDocuments
        );

        await client.send({
          from: `${smtpFromName} <${smtpFromAddress}>`,
          to: recipient.email,
          subject: `📋 Rappel - Documents Administratifs Manquants - ${schoolName}`,
          content: "Veuillez activer l'affichage HTML pour voir ce message.",
          html: htmlContent,
        });

        results.push({ email: recipient.email, success: true });
        console.log(`Email sent successfully to ${recipient.email}`);
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        results.push({ email: recipient.email, success: false, error: error.message });
      }
    }

    await client.close();

    // Log notifications to database for each successful send
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length > 0) {
      const notificationLogs = successfulResults.map((r, idx) => {
        const recipient = recipients.find(rec => rec.email === r.email);
        return {
          school_id: schoolId,
          recipient_type: recipient?.type || 'student',
          recipient_email: r.email,
          recipient_name: recipient?.name || '',
          subject: `Rappel Documents Administratifs - ${className}`,
          message: `Documents manquants: ${recipient?.missingDocuments?.join(', ') || 'N/A'}`,
          sent_at: new Date().toISOString(),
        };
      });

      await supabase.from("school_notifications").insert(notificationLogs);
    }

    const successCount = successfulResults.length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successCount} email(s) envoyé(s) sur ${recipients.length}`,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in send-smtp-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
