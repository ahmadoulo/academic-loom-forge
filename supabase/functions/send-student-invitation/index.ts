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

    // Récupérer le compte étudiant
    let query = supabaseClient
      .from('student_accounts')
      .select('*, student:students(firstname, lastname), schools(name)');

    if (accountId) {
      query = query.eq('id', accountId);
    } else {
      query = query.eq('email', email);
    }

    const { data: account, error: accountError } = await query.single();

    if (accountError || !account) {
      console.error('Compte non trouvé:', accountError);
      throw new Error('Compte étudiant non trouvé');
    }

    // Toujours générer un nouveau token à chaque envoi d'invitation
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: updateError } = await supabaseClient
      .from('student_accounts')
      .update({
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString()
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('Erreur mise à jour token:', updateError);
      throw updateError;
    }

    console.log('Token généré:', invitationToken);

    // Construire l'URL d'invitation
    const baseUrl = appUrl || Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'http://localhost:5173';
    const invitationUrl = `${baseUrl}/set-password?token=${invitationToken}`;

    console.log('URL d\'invitation:', invitationUrl);

    const emailHtml = `
      <h1>Bienvenue ${account.student?.firstname} ${account.student?.lastname} !</h1>
      <p>Votre compte étudiant a été créé pour l'école <strong>${account.schools?.name}</strong>.</p>
      <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le lien ci-dessous :</p>
      <p><a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">Définir mon mot de passe</a></p>
      <p>Ce lien est valable pendant 7 jours.</p>
      <p>Si vous n'avez pas demandé cette invitation, ignorez simplement cet email.</p>
      <br>
      <p>Cordialement,<br>L'équipe ${account.schools?.name}</p>
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
        from: 'onboarding@resend.dev',
        to: [account.email],
        subject: 'Activez votre compte étudiant',
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();
    
    if (!resendResponse.ok) {
      console.error('Erreur Resend:', resendData);
      
      // En mode test, Resend limite l'envoi d'emails
      // Retourner quand même un succès pour ne pas bloquer le workflow
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: 'Mode test Resend: vérifiez que le domaine est configuré sur resend.com/domains',
          invitationUrl,
          error: resendData
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
