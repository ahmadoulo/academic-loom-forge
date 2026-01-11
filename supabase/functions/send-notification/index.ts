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
  pdfAttachment?: {
    filename: string;
    content: string; // base64
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, subject, message, schoolId, recipientType, classId, sentBy, pdfAttachment }: NotificationRequest = await req.json();

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
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    
                    <tr>
                      <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                        ${schoolLogo ? `
                          <img src="${schoolLogo}" alt="${schoolName}" style="max-width: 80px; height: auto; display: block; margin: 0 auto 16px; border-radius: 8px; background-color: white; padding: 8px;">
                        ` : ''}
                        <h2 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 0.5px;">Plateforme Scolaire ${schoolName}</h2>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 32px 32px 0;">
                        <h1 style="margin: 0 0 24px; color: #1e293b; font-size: 24px; font-weight: 700; line-height: 1.3;">${subject}</h1>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 0 32px 32px;">
                        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 24px; border-radius: 8px;">
                          <p style="margin: 0; color: #1e293b; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
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
        const emailPayload: any = {
          from: `${schoolData.name} <noreply@ndiambour-it.com>`,
          to: [recipient.email],
          subject: subject,
          html: createEmailTemplate(schoolData, subject, message),
        };

        // Add PDF attachment if provided
        if (pdfAttachment) {
          emailPayload.attachments = [{
            filename: pdfAttachment.filename,
            content: pdfAttachment.content,
          }];
        }

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
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
});
