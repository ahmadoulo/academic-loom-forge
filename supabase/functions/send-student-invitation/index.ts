import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    // Récupérer le compte étudiant (nouveau système: app_users)
    let query = supabaseClient
      .from('app_users')
      .select('id, email, school_id, student_id, first_name, last_name, schools!app_users_school_id_fkey(name, identifier), students(firstname, lastname)');

    if (accountId) {
      query = query.eq('id', accountId);
    } else {
      query = query.eq('email', email);
    }

    // Important: uniquement les comptes étudiants
    query = query.not('student_id', 'is', null);

    const { data: account, error: accountError } = await query.single();

    if (accountError || !account) {
      console.error('Compte non trouvé:', accountError);
      throw new Error('Compte étudiant non trouvé');
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

    const firstName = account.students?.firstname || account.first_name || '';
    const lastName = account.students?.lastname || account.last_name || '';
    const schoolName = account.schools?.name || 'votre école';
    const schoolIdentifier = account.schools?.identifier || '';

    const emailHtml = `
      <h1>Bienvenue ${firstName} ${lastName} !</h1>
      <p>Votre compte étudiant a été créé pour l'école <strong>${schoolName}</strong>.</p>
      ${schoolIdentifier ? `<p><strong>Identifiant de l'école :</strong> ${schoolIdentifier}</p>` : ''}
      <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le lien ci-dessous :</p>
      <p><a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">Définir mon mot de passe</a></p>
      <p>Ce lien est valable pendant 7 jours.</p>
      <p>Si vous n'avez pas demandé cette invitation, ignorez simplement cet email.</p>
      <br>
      <p>Cordialement,<br>L'équipe ${schoolName}</p>
    `;

    // Envoyer l'email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY non configurée');
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@ndiambour-it.com',
        to: [account.email],
        subject: 'Activez votre compte étudiant',
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Erreur Resend:', resendData);
      // Ne pas bloquer le workflow côté app
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
    console.error('Erreur dans send-student-invitation:', error);
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

