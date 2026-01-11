import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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

    // Récupérer le compte professeur (système: app_users)
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
      console.error('Compte non trouvé:', accountError);
      throw new Error('Compte professeur non trouvé');
    }

    // Générer un nouveau token à chaque envoi d'invitation
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
      console.error('Erreur mise à jour token:', updateError);
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
    const schoolName = account.schools?.name || 'votre école';
    const schoolIdentifier = account.schools?.identifier || '';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bienvenue ${firstName} ${lastName} !</h1>
        <p>Votre compte professeur a été créé pour l'établissement <strong>${schoolName}</strong>.</p>
        ${schoolIdentifier ? `<p><strong>Identifiant de l'école :</strong> ${schoolIdentifier}</p>` : ''}
        <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Activer mon compte
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Ce lien est valable pendant 7 jours.</p>
        <p>Si vous n'avez pas demandé cette invitation, ignorez simplement cet email.</p>
        <br>
        <p>Cordialement,<br>L'équipe ${schoolName}</p>
      </div>
    `;

    // Envoyer l'email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY non configurée');
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Email non envoyé (configuration requise)",
          invitationUrl,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EduVate <noreply@ndiambour-it.com>',
        to: [account.email],
        subject: `Activez votre compte professeur - ${schoolName}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Erreur Resend:', resendData);
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Mode test email: vérifiez la configuration de l'envoi.",
          invitationUrl,
          error: resendData,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('Email envoyé avec succès:', resendData);

    return new Response(
      JSON.stringify({ success: true, message: 'Invitation envoyée' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
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
