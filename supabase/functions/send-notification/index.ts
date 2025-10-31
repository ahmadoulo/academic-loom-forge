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
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
                
                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                      ${schoolName}
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px; font-weight: 400;">
                      Notification officielle
                    </p>
                  </td>
                </tr>

                <!-- Subject -->
                <tr>
                  <td style="padding: 30px 30px 20px 30px;">
                    <h2 style="margin: 0; color: #1f2937; font-size: 22px; font-weight: 600; line-height: 1.3;">
                      ${subject}
                    </h2>
                  </td>
                </tr>

                <!-- Message Content -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="color: #4b5563; font-size: 15px; line-height: 1.7;">
                      ${message.replace(/\n/g, '<br>')}
                    </div>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 30px;">
                    <div style="border-top: 1px solid #e5e7eb;"></div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="text-align: center;">
                          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; font-weight: 500;">
                            ${schoolName}
                          </p>
                          ${school.city ? `<p style="margin: 0 0 5px 0; color: #9ca3af; font-size: 12px;">${school.city}</p>` : ''}
                          ${school.phone ? `<p style="margin: 0 0 5px 0; color: #9ca3af; font-size: 12px;">Tél: ${school.phone}</p>` : ''}
                          ${school.website ? `<p style="margin: 0; color: #9ca3af; font-size: 12px;"><a href="${school.website}" style="color: #667eea; text-decoration: none;">${school.website}</a></p>` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px; text-align: center;">
                          <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
                            Cet email a été envoyé à ${recipientEmail}<br>
                            Si vous avez des questions, veuillez contacter l'administration.
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
