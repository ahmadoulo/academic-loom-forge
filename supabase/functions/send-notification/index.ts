import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  recipients: string[];
  subject: string;
  message: string;
  schoolId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, subject, message, schoolId }: NotificationRequest = await req.json();

    console.log(`Sending notification to ${recipients.length} recipient(s)`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get school information
    const { data: school, error: schoolError } = await supabaseClient
      .from('schools')
      .select('name, logo_url, city, phone, website')
      .eq('id', schoolId)
      .single();

    if (schoolError || !school) {
      console.error('School not found:', schoolError);
      throw new Error('École non trouvée');
    }

    const schoolName = school.name;
    console.log(`Sending from school: ${schoolName}`);

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY non configurée');
    }

    // Create beautiful email HTML
    const createEmailHtml = (recipientEmail: string) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <!-- Main Container -->
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);">
                
                <!-- Header with gradient and logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center;">
                    ${school.logo_url ? `<img src="${school.logo_url}" alt="${schoolName}" style="width: 80px; height: 80px; border-radius: 50%; background: white; padding: 10px; margin-bottom: 20px; object-fit: contain;" />` : ''}
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      ${schoolName}
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #e0e7ff; font-size: 15px; font-weight: 500;">
                      📧 Notification officielle
                    </p>
                  </td>
                </tr>

                <!-- Subject Badge -->
                <tr>
                  <td style="padding: 40px 30px 0 30px;">
                    <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <h2 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 700; line-height: 1.3;">
                        ${subject}
                      </h2>
                    </div>
                  </td>
                </tr>

                <!-- Message Content -->
                <tr>
                  <td style="padding: 0 30px 40px 30px;">
                    <div style="color: #4b5563; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">
                      ${message.replace(/\n/g, '<br>')}
                    </div>
                  </td>
                </tr>

                <!-- Decorative Divider -->
                <tr>
                  <td style="padding: 0 30px;">
                    <div style="height: 2px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent);"></div>
                  </td>
                </tr>

                <!-- Footer with school details -->
                <tr>
                  <td style="padding: 40px 30px; background: linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%);">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="text-align: center; padding-bottom: 20px;">
                          <div style="display: inline-block; background: white; padding: 20px 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                            <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 700;">
                              ${schoolName}
                            </p>
                            ${school.city ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">📍 ${school.city}</p>` : ''}
                            ${school.phone ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">📞 ${school.phone}</p>` : ''}
                            ${school.website ? `<p style="margin: 0; color: #667eea; font-size: 14px;"><a href="${school.website}" style="color: #667eea; text-decoration: none; font-weight: 500;">🌐 ${school.website}</a></p>` : ''}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                            Cet email a été envoyé à <strong>${recipientEmail}</strong><br>
                            Pour toute question, veuillez contacter l'administration de l'école.
                          </p>
                          <p style="margin: 16px 0 0 0; color: #d1d5db; font-size: 11px;">
                            © ${new Date().getFullYear()} ${schoolName}. Tous droits réservés.
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

    // Send emails to all recipients using Resend API
    const emailPromises = recipients.map(async (email) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${schoolName} <noreply@ndiambour-it.com>`,
          to: [email],
          subject: subject,
          html: createEmailHtml(email),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`Failed to send email to ${email}:`, error);
        throw new Error(`Failed to send email to ${email}`);
      }

      return response.json();
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Email results: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful,
        failed: failed,
        total: recipients.length
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
