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
            <style>
              @media only screen and (max-width: 600px) {
                .container { width: 100% !important; padding: 20px 10px !important; }
                .content-padding { padding: 30px 20px !important; }
                .button { padding: 14px 30px !important; font-size: 14px !important; }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <!-- Main Container -->
                  <table role="presentation" class="container" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Logo Section -->
                    <tr>
                      <td style="padding: 40px 20px 20px; text-align: center; background-color: #ffffff;">
                        ${schoolLogo ? `
                          <img src="${schoolLogo}" alt="${schoolName}" style="max-width: 80px; height: auto; display: inline-block; margin-bottom: 10px;">
                        ` : `
                          <div style="width: 60px; height: 60px; background-color: #667eea; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                            <span style="color: #ffffff; font-size: 24px; font-weight: bold;">📧</span>
                          </div>
                        `}
                      </td>
                    </tr>

                    <!-- Message Icon -->
                    <tr>
                      <td style="text-align: center; padding: 0 20px 20px;">
                        <div style="width: 60px; height: 60px; background-color: #e8eeff; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                          <span style="font-size: 28px;">💬</span>
                        </div>
                      </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                      <td style="padding: 0 20px; text-align: center;">
                        <p style="margin: 0; color: #667eea; font-size: 16px; font-weight: 500;">Bonjour,</p>
                      </td>
                    </tr>

                    <!-- Subject -->
                    <tr>
                      <td style="padding: 15px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #1a202c; font-size: 22px; font-weight: 600; line-height: 1.3;">${subject}</h1>
                      </td>
                    </tr>

                    <!-- Message Content -->
                    <tr>
                      <td class="content-padding" style="padding: 20px 40px;">
                        <div style="background-color: #f8f9fa; border-left: 3px solid #667eea; padding: 20px; border-radius: 4px;">
                          <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                        </div>
                      </td>
                    </tr>

                    <!-- Sender Info -->
                    <tr>
                      <td style="padding: 15px 40px 30px; text-align: center;">
                        <p style="margin: 0; color: #718096; font-size: 13px;">Envoyé par <strong>${schoolName}</strong></p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #2d3748; text-align: center;">
                        <p style="margin: 0 0 12px; color: #e2e8f0; font-size: 16px; font-weight: 600;">${schoolName}</p>
                        
                        ${schoolAddress ? `
                          <p style="margin: 0 0 8px; color: #a0aec0; font-size: 13px;">
                            📍 ${schoolAddress}
                          </p>
                        ` : ''}
                        
                        ${schoolPhone ? `
                          <p style="margin: 0 0 8px; color: #a0aec0; font-size: 13px;">
                            📞 ${schoolPhone}
                          </p>
                        ` : ''}
                        
                        ${schoolWebsite ? `
                          <p style="margin: 0 0 15px; color: #a0aec0; font-size: 13px;">
                            🌐 <a href="${schoolWebsite}" style="color: #667eea; text-decoration: none;">${schoolWebsite}</a>
                          </p>
                        ` : ''}

                        <div style="border-top: 1px solid #4a5568; margin: 20px 0; padding-top: 20px;">
                          <p style="margin: 0; color: #718096; font-size: 11px;">
                            © ${new Date().getFullYear()} ${schoolName}. Tous droits réservés.
                          </p>
                          <p style="margin: 8px 0 0; color: #718096; font-size: 11px;">
                            Cet email a été envoyé automatiquement depuis la plateforme de gestion scolaire.
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
