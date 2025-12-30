import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  email: string;
  schoolIdentifier: string;
  appUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, schoolIdentifier, appUrl }: VerifyRequest = await req.json();

    if (!email || !schoolIdentifier) {
      return new Response(
        JSON.stringify({ error: 'Email et identifiant école requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('Vérification compte étudiant:', { email: normalizedEmail, schoolIdentifier });

    // 1) Vérifier si l'école existe
    const { data: school, error: schoolError } = await supabaseClient
      .from('schools')
      .select('id, name')
      .eq('identifier', schoolIdentifier)
      .single();

    if (schoolError || !school) {
      console.log('École non trouvée:', schoolIdentifier);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'school_not_found',
          message: "Identifiant d'école invalide. Vérifiez auprès de votre établissement.",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 2) Chercher d'abord un compte existant dans app_users
    const { data: existingAccount, error: accountError } = await supabaseClient
      .from('app_users')
      .select(`
        id,
        email,
        is_active,
        student_id,
        first_name,
        last_name,
        students(firstname, lastname, email)
      `)
      .eq('email', normalizedEmail)
      .eq('school_id', school.id)
      .not('student_id', 'is', null)
      .maybeSingle();

    if (accountError) {
      console.error('Erreur recherche compte app_users:', accountError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'verification_error',
          message: 'Erreur lors de la vérification du compte',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let account = existingAccount as any;
    let studentInfo: { id: string; firstname: string; lastname: string; email: string } | null = null;

    // 3) Si pas de compte, vérifier si l'étudiant existe BIEN dans cette école (student_school)
    if (!account) {
      console.log('Pas de compte app_users, recherche étudiant via student_school...');

      const { data: enrollment, error: enrollmentError } = await supabaseClient
        .from('student_school')
        .select(`
          student_id,
          students!inner(id, firstname, lastname, email)
        `)
        .eq('school_id', school.id)
        .eq('is_active', true)
        .eq('students.email', normalizedEmail)
        .maybeSingle();

      if (enrollmentError) {
        console.error('Erreur recherche student_school:', enrollmentError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'verification_error',
            message: 'Erreur lors de la vérification du compte',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (!enrollment?.students) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'student_not_found',
            message:
              "Aucun compte étudiant trouvé avec cet email pour cette école. Contactez votre établissement.",
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      studentInfo = enrollment.students;

      // 4) Créer automatiquement le compte app_users (inactif) pour cet étudiant
      const { data: newAccount, error: createError } = await supabaseClient
        .from('app_users')
        .insert({
          email: normalizedEmail,
          first_name: studentInfo.firstname,
          last_name: studentInfo.lastname,
          student_id: studentInfo.id,
          school_id: school.id,
          is_active: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Erreur création compte app_users:', createError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'account_creation_error',
            message: 'Erreur lors de la création du compte. Contactez votre établissement.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      account = newAccount;
    }

    // 5) Déjà actif ?
    if (account.is_active) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'already_active',
          message: 'Votre compte est déjà actif. Vous pouvez vous connecter directement.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 6) Générer un token d'invitation
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: updateError } = await supabaseClient
      .from('app_users')
      .update({
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString(),
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('Erreur mise à jour token:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'token_error',
          message: "Erreur lors de la génération de l'invitation",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 7) URL dynamique
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

    if (!baseUrl) baseUrl = 'http://localhost:5173';

    const invitationUrl = `${baseUrl}/set-password?token=${invitationToken}`;

    // 8) Nom
    const firstName = studentInfo?.firstname || account.first_name || '';
    const lastName = studentInfo?.lastname || account.last_name || '';

    // 9) Envoyer l'email
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY non configurée - mode test');
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'Email non envoyé (configuration requise)',
          invitationUrl,
          message: "Token généré mais email non envoyé. Contactez l'administrateur.",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bienvenue ${firstName} ${lastName} !</h1>
        <p>Votre compte étudiant a été créé pour l'établissement <strong>${school.name}</strong>.</p>
        <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Activer mon compte
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Ce lien est valable pendant 7 jours.</p>
        <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette invitation, ignorez simplement cet email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">Cordialement,<br/>L'équipe ${school.name}</p>
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EduVate <noreply@ndiambour-it.com>',
        to: [normalizedEmail],
        subject: `Activez votre compte étudiant - ${school.name}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Erreur Resend:', resendData);
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Problème lors de l'envoi de l'email",
          invitationUrl,
          message: "Invitation créée. Contactez votre établissement si vous ne recevez pas l'email.",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email d'activation envoyé ! Vérifiez votre boîte de réception.",
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erreur dans verify-student-account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ success: false, error: 'server_error', message: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  email: string;
  schoolIdentifier: string;
  appUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, schoolIdentifier, appUrl }: VerifyRequest = await req.json();

    if (!email || !schoolIdentifier) {
      return new Response(
        JSON.stringify({ error: 'Email et identifiant école requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('Vérification compte étudiant:', { email: normalizedEmail, schoolIdentifier });

    // 1. Vérifier si l'école existe
    const { data: school, error: schoolError } = await supabaseClient
      .from('schools')
      .select('id, name')
      .eq('identifier', schoolIdentifier)
      .single();

    if (schoolError || !school) {
      console.log('École non trouvée:', schoolIdentifier);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'school_not_found',
          message: 'Identifiant d\'école invalide. Vérifiez auprès de votre établissement.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('École trouvée:', school.name);

    // 2. D'abord chercher dans app_users (compte existant)
    const { data: existingAccount, error: accountError } = await supabaseClient
      .from('app_users')
      .select(`
        id, 
        email, 
        is_active, 
        student_id,
        first_name,
        last_name,
        students(firstname, lastname)
      `)
      .eq('email', normalizedEmail)
      .eq('school_id', school.id)
      .not('student_id', 'is', null)
      .maybeSingle();

    if (accountError) {
      console.error('Erreur recherche compte app_users:', accountError);
    }

    let account = existingAccount;
    let studentInfo = null;

    // 3. Si pas trouvé dans app_users, chercher dans students directement
    if (!account) {
      console.log('Pas de compte app_users, recherche dans students...');
      
      const { data: student, error: studentError } = await supabaseClient
        .from('students')
        .select('id, firstname, lastname, email, class_id')
        .eq('email', normalizedEmail)
        .eq('school_id', school.id)
        .maybeSingle();

      if (studentError) {
        console.error('Erreur recherche student:', studentError);
      }

      if (student) {
        console.log('Étudiant trouvé dans students:', student.id);
        studentInfo = student;

        // Créer automatiquement le compte app_users pour cet étudiant
        const { data: newAccount, error: createError } = await supabaseClient
          .from('app_users')
          .insert({
            email: normalizedEmail,
            first_name: student.firstname,
            last_name: student.lastname,
            student_id: student.id,
            school_id: school.id,
            is_active: false,
          })
          .select()
          .single();

        if (createError) {
          console.error('Erreur création compte app_users:', createError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'account_creation_error',
              message: 'Erreur lors de la création du compte. Contactez votre établissement.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        console.log('Compte app_users créé:', newAccount.id);
        account = newAccount;
      }
    }

    // 4. Si toujours pas trouvé
    if (!account) {
      console.log('Aucun étudiant trouvé pour:', normalizedEmail, 'dans école:', school.id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'student_not_found',
          message: 'Aucun compte étudiant trouvé avec cet email pour cette école. Contactez votre établissement.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 5. Vérifier si le compte est déjà actif
    if (account.is_active) {
      console.log('Compte déjà actif:', account.id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'already_active',
          message: 'Votre compte est déjà actif. Vous pouvez vous connecter directement.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 6. Générer un token d'invitation
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: updateError } = await supabaseClient
      .from('app_users')
      .update({
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString(),
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('Erreur mise à jour token:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'token_error',
          message: 'Erreur lors de la génération de l\'invitation' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 7. Construire l'URL d'invitation dynamique
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

    // Récupérer le nom
    const firstName = studentInfo?.firstname || account.students?.firstname || account.first_name || '';
    const lastName = studentInfo?.lastname || account.students?.lastname || account.last_name || '';

    // 8. Envoyer l'email d'invitation
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY non configurée - mode test');
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: 'Email non envoyé (configuration requise)',
          invitationUrl,
          message: 'Token généré mais email non envoyé. Contactez l\'administrateur.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bienvenue ${firstName} ${lastName} !</h1>
        <p>Votre compte étudiant a été créé pour l'établissement <strong>${school.name}</strong>.</p>
        <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Activer mon compte
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Ce lien est valable pendant 7 jours.</p>
        <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette invitation, ignorez simplement cet email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">Cordialement,<br>L'équipe ${school.name}</p>
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EduVate <noreply@ndiambour-it.com>',
        to: [normalizedEmail],
        subject: `Activez votre compte étudiant - ${school.name}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Erreur Resend:', resendData);
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: 'Problème lors de l\'envoi de l\'email',
          invitationUrl,
          message: 'Invitation créée. Contactez votre établissement si vous ne recevez pas l\'email.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Email d\'activation envoyé avec succès:', resendData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email d\'activation envoyé ! Vérifiez votre boîte de réception.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Erreur dans verify-student-account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ success: false, error: 'server_error', message: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
