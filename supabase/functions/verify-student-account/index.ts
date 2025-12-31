import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  email: string;
  schoolIdentifier: string;
  appUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { email, schoolIdentifier, appUrl }: VerifyRequest = await req.json();

    if (!email || !schoolIdentifier) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "bad_request",
          message: "Email et identifiant école requis",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedIdentifier = String(schoolIdentifier).trim();

    console.log("verify-student-account:start", {
      email: normalizedEmail,
      schoolIdentifier: normalizedIdentifier,
    });

    // 1) School lookup
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id, name, identifier")
      .eq("identifier", normalizedIdentifier)
      .maybeSingle();

    if (schoolError) {
      console.error("verify-student-account:schoolError", schoolError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "school_lookup_error",
          message: "Erreur lors de la vérification de l'école",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (!school) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "school_not_found",
          message: "Identifiant d'école invalide. Vérifiez auprès de votre établissement.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // 2) Student lookup in students table (source of truth for eligibility)
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, firstname, lastname, email, school_id")
      .eq("email", normalizedEmail)
      .eq("school_id", school.id)
      .maybeSingle();

    if (studentError) {
      console.error("verify-student-account:studentError", studentError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "student_lookup_error",
          message: "Erreur lors de la vérification de l'étudiant",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (!student) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "student_not_found",
          message:
            "Aucun étudiant trouvé avec cet email pour cette école. Contactez votre établissement.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // 3) Ensure app_users exists for this student
    const { data: existingAccount, error: accountError } = await supabase
      .from("app_users")
      .select("id, email, is_active, student_id, first_name, last_name, school_id")
      .eq("school_id", school.id)
      .eq("student_id", student.id)
      .maybeSingle();

    if (accountError) {
      console.error("verify-student-account:accountError", accountError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "account_lookup_error",
          message: "Erreur lors de la vérification du compte",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    let account = existingAccount;

    if (!account) {
      const { data: newAccount, error: createError } = await supabase
        .from("app_users")
        .insert({
          email: normalizedEmail,
          first_name: student.firstname,
          last_name: student.lastname,
          student_id: student.id,
          school_id: school.id,
          is_active: false,
        })
        .select("id, email, is_active, student_id, first_name, last_name, school_id")
        .single();

      if (createError) {
        console.error("verify-student-account:createAccountError", createError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "account_creation_error",
            message: "Erreur lors de la création du compte. Contactez votre établissement.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }

      account = newAccount;
    }

    // 4) Already active
    if (account.is_active) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "already_active",
          message: "Votre compte est déjà actif. Vous pouvez vous connecter directement.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // 5) Generate invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: tokenError } = await supabase
      .from("app_users")
      .update({
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString(),
      })
      .eq("id", account.id);

    if (tokenError) {
      console.error("verify-student-account:tokenError", tokenError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "token_error",
          message: "Erreur lors de la génération de l'invitation",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // 6) Build invitation URL
    let baseUrl = (appUrl && String(appUrl).trim()) || "";
    if (!baseUrl) {
      const origin = req.headers.get("origin");
      const referer = req.headers.get("referer");
      if (origin) baseUrl = origin;
      else if (referer) {
        try {
          baseUrl = new URL(referer).origin;
        } catch {
          // ignore
        }
      }
    }
    if (!baseUrl) baseUrl = "http://localhost:5173";

    const invitationUrl = `${baseUrl}/set-password?token=${invitationToken}`;

    // 7) Send email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.warn("verify-student-account: RESEND_API_KEY missing (test mode)");
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Email non envoyé (configuration requise)",
          invitationUrl,
          schoolIdentifier: school.identifier,
          message: "Invitation créée (mode test).",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bienvenue ${student.firstname} ${student.lastname} !</h1>
        <p>Votre compte étudiant est prêt pour l'établissement <strong>${school.name}</strong>.</p>
        <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Activer mon compte
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Ce lien est valable pendant 7 jours.</p>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EduVate <noreply@ndiambour-it.com>",
        to: [normalizedEmail],
        subject: `Activez votre compte étudiant - ${school.name}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json().catch(() => null);

    if (!resendResponse.ok) {
      console.error("verify-student-account:resendError", resendData);
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Problème lors de l'envoi de l'email",
          invitationUrl,
          schoolIdentifier: school.identifier,
          message: "Invitation créée. Réessayez ou contactez votre établissement.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email d'activation envoyé ! Vérifiez votre boîte de réception.",
        schoolIdentifier: school.identifier,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("verify-student-account:unhandled", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ success: false, error: "server_error", message: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
