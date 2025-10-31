import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRecipient {
  email: string;
  name: string;
}

interface NotificationRequest {
  recipients: NotificationRecipient[];
  subject: string;
  message: string;
  schoolId: string;
  recipientType: string;
  classId?: string;
  sentBy?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, subject, message, schoolId, recipientType, classId, sentBy }: NotificationRequest = await req.json();

    console.log(`Sending notification to ${recipients.length} recipient(s)`);

    // Initialize Supabase client
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
      throw new Error('École non trouvée');
    }

    console.log(`Sending from school: ${schoolData.name}`);

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY non configurée');
    }

    // Create beautiful email template
    const createEmailTemplate = (schoolData: any, subject: string, message: string) => {
      const schoolName = schoolData?.name || 'École';
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
            <title>${subject}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
              <tr>
                <td>
                  <!-- Header Card -->
                  <table role="presentation" style="width: 100%; background: white; border-radius: 16px 16px 0 0; overflow: hidden;">
                    <tr>
                      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        ${schoolLogo ? `
                          <div style="background: white; display: inline-block; padding: 15px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <img src="${schoolLogo}" alt="${schoolName}" style="max-width: 100px; height: auto; display: block;">
                          </div>
                        ` : ''}
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Plateforme Scolaire</h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 18px; font-weight: 500;">${schoolName}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Content Card -->
                  <table role="presentation" style="width: 100%; background: white;">
                    <tr>
                      <td style="padding: 40px 30px;">
                        <!-- Subject -->
                        <div style="background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #667eea;">
                          <h2 style="margin: 0; color: #1a202c; font-size: 20px; font-weight: 600;">${subject}</h2>
                        </div>

                        <!-- Message -->
                        <div style="color: #2d3748; font-size: 15px; line-height: 1.8; margin-bottom: 30px;">
                          ${message.replace(/\n/g, '<br>')}
                        </div>

                        <!-- Divider -->
                        <div style="border-top: 2px solid #e2e8f0; margin: 30px 0;"></div>

                        <!-- Info Box -->
                        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                          <p style="margin: 0 0 8px; color: #718096; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Information</p>
                          <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                            Ce message a été envoyé automatiquement depuis la plateforme de gestion scolaire. Pour toute question, veuillez contacter l'établissement.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Footer Card -->
                  <table role="presentation" style="width: 100%; background: #1a202c; border-radius: 0 0 16px 16px;">
                    <tr>
                      <td style="padding: 30px; text-align: center;">
                        <p style="margin: 0 0 15px; color: #e2e8f0; font-size: 16px; font-weight: 600;">${schoolName}</p>
                        
                        ${schoolAddress ? `
                          <p style="margin: 0 0 8px; color: #a0aec0; font-size: 14px; line-height: 1.6;">
                            📍 ${schoolAddress}
                          </p>
                        ` : ''}
                        
                        ${schoolPhone ? `
                          <p style="margin: 0 0 8px; color: #a0aec0; font-size: 14px;">
                            📞 ${schoolPhone}
                          </p>
                        ` : ''}
                        
                        ${schoolWebsite ? `
                          <p style="margin: 0 0 15px; color: #a0aec0; font-size: 14px;">
                            🌐 <a href="${schoolWebsite}" style="color: #667eea; text-decoration: none;">${schoolWebsite}</a>
                          </p>
                        ` : ''}

                        <div style="border-top: 1px solid #2d3748; margin: 20px 0; padding-top: 20px;">
                          <p style="margin: 0; color: #718096; font-size: 12px;">
                            © ${new Date().getFullYear()} ${schoolName}. Tous droits réservés.
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

    // Send emails and collect results
    const results = [];
    const notificationRecords = [];

    for (const recipient of recipients) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${schoolData.name} <noreply@ndiambour-it.com>`,
            to: [recipient.email],
            subject: subject,
            html: createEmailTemplate(schoolData, subject, message),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Failed to send email to ${recipient.email}:`, error);
          results.push({ email: recipient.email, success: false, error: error.message });
        } else {
          const emailResponse = await response.json();
          console.log(`Email sent to ${recipient.email}:`, emailResponse);
          
          results.push({ 
            email: recipient.email, 
            success: true,
            id: emailResponse.id
          });

          // Store notification record
          notificationRecords.push({
            school_id: schoolId,
            recipient_type: recipientType,
            recipient_email: recipient.email,
            recipient_name: recipient.name,
            subject: subject,
            message: message,
            class_id: classId || null,
            sent_by: sentBy || null
          });
        }
      } catch (error: any) {
        console.error(`Error sending to ${recipient.email}:`, error);
        results.push({ email: recipient.email, success: false, error: error.message });
      }
    }

    // Save all notification records to database
    if (notificationRecords.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('school_notifications')
        .insert(notificationRecords);
      
      if (insertError) {
        console.error('Error saving notification records:', insertError);
      } else {
        console.log(`Saved ${notificationRecords.length} notification records`);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Successfully sent ${successful} notifications, ${failed} failed`);

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
