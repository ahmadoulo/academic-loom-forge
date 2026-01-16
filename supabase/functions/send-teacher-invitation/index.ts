import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { accountId, email, appUrl } = await req.json();

    if (!accountId && !email) {
      throw new Error('accountId ou email requis');
    }

    // Recuperer le compte professeur (systeme: app_users)
    let query = supabaseClient
      .from('app_users')
      .select('id, email, school_id, teacher_id, first_name, last_name, schools!app_users_school_id_fkey(name, identifier), teachers(firstname, lastname)');

    if (accountId) {
      query = query.eq('id', accountId);
    } else {
      query = query.eq('email', email);
    }

    // Important: uniquement les comptes professeurs
    query = query.not('teacher_id', 'is', null);

    const { data: account, error: accountError } = await query.single();

    if (accountError || !account) {
      console.error('Compte non trouve:', accountError);
      throw new Error('Compte professeur non trouve');
    }

    // Generer un nouveau token a chaque envoi d'invitation
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: updateError } = await supabaseClient
      .from('app_users')
      .update({
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString(),
        is_active: false,
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('Erreur mise a jour token:', updateError);
      throw updateError;
    }

    // Construire l'URL d'invitation
    let baseUrl = (appUrl && String(appUrl).trim()) || '';

    if (!baseUrl) {
      const origin = req.headers.get('origin');
      const referer = req.headers.get('referer');
      if (origin) baseUrl = origin;
      else if (referer) {
        try {
          baseUrl = new URL(referer).origin;
        } catch {
          // ignore
        }
      }
    }

    if (!baseUrl) {
      baseUrl = 'http://localhost:5173';
    }

    const invitationUrl = `${baseUrl}/set-password?token=${invitationToken}`;

    const firstName = account.teachers?.firstname || account.first_name || '';
    const lastName = account.teachers?.lastname || account.last_name || '';
    const schoolName = account.schools?.name || 'votre ecole';
    const schoolIdentifier = account.schools?.identifier || '';

    // Get SMTP configuration
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromAddress = Deno.env.get("SMTP_FROM_ADDRESS");
    const smtpSecure = Deno.env.get("SMTP_SECURE") === "true";

    if (!smtpHost || !smtpUsername || !smtpPassword || !smtpFromAddress) {
      console.warn('SMTP configuration incomplete');
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Email non envoye (configuration SMTP requise)",
          invitationUrl,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Activez votre compte</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                      <h2 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 0.5px;">Plateforme Scolaire ${schoolName}</h2>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 32px;">
                      <h1 style="margin: 0 0 24px; color: #1e293b; font-size: 24px; font-weight: 700; line-height: 1.3;">Bienvenue ${firstName} ${lastName} !</h1>
                      
                      <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.7;">
                        Votre compte professeur a ete cree pour l'etablissement <strong>${schoolName}</strong>.
                      </p>
                      
                      ${schoolIdentifier ? `
                        <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.7;">
                          <strong>Identifiant de l'ecole :</strong> ${schoolIdentifier}
                        </p>
                      ` : ''}
                      
                      <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.7;">
                        Pour activer votre compte et definir votre mot de passe, cliquez sur le bouton ci-dessous :
                      </p>
                      
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${invitationUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          Activer mon compte
                        </a>
                      </div>
                      
                      <p style="margin: 0 0 16px; color: #64748b; font-size: 14px; line-height: 1.7;">
                        Ce lien est valable pendant 7 jours.
                      </p>
                      
                      <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.7;">
                        Si vous n'avez pas demande cette invitation, ignorez simplement cet email.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 24px 32px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; color: #64748b; font-size: 14px;">
                        Cordialement,<br>
                        <strong>L'equipe ${schoolName}</strong>
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

    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Connexion SMTP echouee",
          invitationUrl,
          error: verifyError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    try {
      const mailOptions = {
        from: `"${schoolName}" <${smtpFromAddress}>`,
        to: account.email,
        subject: `Activez votre compte professeur - ${schoolName}`,
        text: `Bienvenue ${firstName} ${lastName}! Cliquez sur ce lien pour activer votre compte: ${invitationUrl}`,
        html: emailHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email envoye avec succes:', info.messageId);
      transporter.close();

      return new Response(
        JSON.stringify({ success: true, message: 'Invitation envoyee' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (emailError: any) {
      console.error('Erreur envoi email:', emailError);
      transporter.close();
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Mode test email: verifiez la configuration de l'envoi.",
          invitationUrl,
          error: emailError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error('Erreur dans send-teacher-invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
