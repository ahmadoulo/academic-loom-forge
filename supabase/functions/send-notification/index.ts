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
                .container { width: 100% !important; max-width: 100% !important; }
                .content-padding { padding: 20px 15px !important; }
                .logo-img { max-width: 100px !important; }
                .platform-title { font-size: 14px !important; }
                .subject-title { font-size: 18px !important; }
                .footer-section { padding: 20px 15px !important; }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px 10px;">
              <tr>
                <td align="center">
                  <!-- Main Container -->
                  <table role="presentation" class="container" style="width: 100%; max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header Section with Logo and Platform Title -->
                    <tr>
                      <td style="padding: 30px 25px 20px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #e5e7eb;">
                        ${schoolLogo ? `
                          <img src="${schoolLogo}" alt="${schoolName}" class="logo-img" style="max-width: 120px; height: auto; display: block; margin: 0 auto 12px;">
                        ` : ''}
                        <p class="platform-title" style="margin: 0; color: #6b7280; font-size: 15px; font-weight: 500;">Plateforme Scolaire ${schoolName}</p>
                      </td>
                    </tr>

                    <!-- Subject -->
                    <tr>
                      <td style="padding: 25px 25px 20px; text-align: center;">
                        <h1 class="subject-title" style="margin: 0; color: #111827; font-size: 20px; font-weight: 700; line-height: 1.3;">${subject}</h1>
                      </td>
                    </tr>

                    <!-- Message Content -->
                    <tr>
                      <td class="content-padding" style="padding: 0 25px 30px;">
                        <div style="background-color: #f9fafb; border-left: 3px solid #3b82f6; padding: 20px; border-radius: 4px;">
                          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td class="footer-section" style="padding: 25px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); text-align: center;">
                        <p style="margin: 0 0 12px; color: #ffffff; font-size: 16px; font-weight: 700;">${schoolName}</p>
                        
                        <div style="margin: 15px 0;">
                          ${schoolAddress ? `
                            <p style="margin: 0 0 8px; color: #dbeafe; font-size: 12px; line-height: 1.5;">
                              ${schoolAddress}
                            </p>
                          ` : ''}
                          
                          ${schoolPhone ? `
                            <p style="margin: 0 0 8px; color: #dbeafe; font-size: 12px;">
                              ${schoolPhone}
                            </p>
                          ` : ''}
                          
                          ${schoolWebsite ? `
                            <p style="margin: 0; color: #dbeafe; font-size: 12px;">
                              <a href="${schoolWebsite}" style="color: #ffffff; text-decoration: underline;">${schoolWebsite}</a>
                            </p>
                          ` : ''}
                        </div>

                        <div style="border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 18px 0 0; padding-top: 15px;">
                          <p style="margin: 0; color: #dbeafe; font-size: 11px; line-height: 1.4;">
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
