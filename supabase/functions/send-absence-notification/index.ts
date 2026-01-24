import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AbsenceNotificationRequest {
  studentId: string;
  studentName: string;
  studentEmail: string;
  tutorEmail?: string;
  tutorName?: string;
  schoolId: string;
  subjectName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  className: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      studentId,
      studentName,
      studentEmail,
      tutorEmail,
      tutorName,
      schoolId,
      subjectName,
      sessionDate,
      startTime,
      endTime,
      className
    }: AbsenceNotificationRequest = await req.json();

    console.log(`Sending absence notification for student: ${studentName}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get school information
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('name, logo_url, address, phone, website')
      .eq('id', schoolId)
      .single();

    if (schoolError || !schoolData) {
      console.error('School not found:', schoolError);
      throw new Error('Ecole non trouvee');
    }

    const schoolName = schoolData.name || 'Ecole';

    // Get SMTP configuration
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromAddress = Deno.env.get("SMTP_FROM_ADDRESS");
    const smtpSecure = Deno.env.get("SMTP_SECURE") === "true";

    if (!smtpHost || !smtpUsername || !smtpPassword || !smtpFromAddress) {
      console.error("Missing SMTP configuration");
      throw new Error("Configuration SMTP incomplete");
    }

    const createEmailTemplate = (schoolData: any, studentName: string, subjectName: string, sessionDate: string, startTime: string, endTime: string, className: string) => {
      const schoolAddress = schoolData?.address || '';
      const schoolPhone = schoolData?.phone || '';
      const schoolWebsite = schoolData?.website || '';
      const schoolLogo = schoolData?.logo_url || '';

      return `
        <!DOCTYPE html>
        <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Notification d'Absence</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    
                    <tr>
                      <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                        ${schoolLogo ? `
                          <img src="${schoolLogo}" alt="${schoolName}" style="max-width: 80px; height: auto; display: block; margin: 0 auto 16px; border-radius: 8px; background-color: white; padding: 8px;">
                        ` : ''}
                        <h2 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 0.5px;">Plateforme Scolaire ${schoolName}</h2>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 32px 32px 0;">
                        <h1 style="margin: 0 0 24px; color: #1e293b; font-size: 24px; font-weight: 700; line-height: 1.3;">Notification d'Absence</h1>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 0 32px 32px;">
                        <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left: 4px solid #ef4444; padding: 24px; border-radius: 8px;">
                          <p style="margin: 0 0 16px; color: #1e293b; font-size: 15px; line-height: 1.7;">
                            Nous vous informons que <strong>${studentName}</strong> a ete marque(e) absent(e) a la seance suivante :
                          </p>
                          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 16px;">
                            <table style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Classe:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px; text-align: right;">${className}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Matiere:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px; text-align: right;">${subjectName}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px; text-align: right;">${new Date(sessionDate).toLocaleDateString('fr-FR')}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Horaire:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px; text-align: right;">${startTime} - ${endTime}</td>
                              </tr>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 32px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); text-align: center;">
                        <h3 style="margin: 0 0 16px; color: #ffffff; font-size: 18px; font-weight: 700;">${schoolName}</h3>
                        
                        <div style="margin: 16px 0; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px;">
                          ${schoolAddress ? `
                            <p style="margin: 0 0 8px; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                              ${schoolAddress}
                            </p>
                          ` : ''}
                          
                          ${schoolPhone ? `
                            <p style="margin: 0 0 8px; color: #cbd5e1; font-size: 13px;">
                              ${schoolPhone}
                            </p>
                          ` : ''}
                          
                          ${schoolWebsite ? `
                            <p style="margin: 0 0 8px; color: #cbd5e1; font-size: 13px;">
                              <a href="${schoolWebsite}" style="color: #60a5fa; text-decoration: none;">${schoolWebsite}</a>
                            </p>
                          ` : ''}
                        </div>

                        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 20px 0 0; padding-top: 16px;">
                          <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                            ${new Date().getFullYear()} ${schoolName}. Tous droits reserves.
                          </p>
                        </div>
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

    // Create transporter with nodemailer
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

    // Verify connection
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      throw new Error(`Connexion SMTP echouee: ${verifyError.message}`);
    }

    const results = [];
    const recipients: string[] = [];
    const htmlContent = createEmailTemplate(schoolData, studentName, subjectName, sessionDate, startTime, endTime, className);

    // Send to student
    if (studentEmail) {
      recipients.push(studentEmail);
      try {
        const mailOptions = {
          from: `"${schoolName}" <${smtpFromAddress}>`,
          to: studentEmail,
          subject: `Notification d'Absence - ${schoolName}`,
          text: `Notification d'absence pour ${studentName} - Matiere: ${subjectName}, Date: ${sessionDate}, Horaire: ${startTime} - ${endTime}`,
          html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to student: ${info.messageId}`);
        results.push({ email: studentEmail, success: true });
      } catch (error: any) {
        console.error(`Error sending to student:`, error);
        results.push({ email: studentEmail, success: false, error: error.message });
      }
    }

    // Send to tutor/parent
    if (tutorEmail) {
      recipients.push(tutorEmail);
      try {
        const mailOptions = {
          from: `"${schoolName}" <${smtpFromAddress}>`,
          to: tutorEmail,
          subject: `Notification d'Absence de votre enfant - ${schoolName}`,
          text: `Notification d'absence pour ${studentName} - Matiere: ${subjectName}, Date: ${sessionDate}, Horaire: ${startTime} - ${endTime}`,
          html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to tutor: ${info.messageId}`);
        results.push({ email: tutorEmail, success: true });
      } catch (error: any) {
        console.error(`Error sending to tutor:`, error);
        results.push({ email: tutorEmail, success: false, error: error.message });
      }
    }

    // Close transporter
    transporter.close();

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Sent ${successful} absence notification(s) to ${recipients.join(', ')}, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, results, sent: successful, failed }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-absence-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
