import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import nodemailer from "npm:nodemailer@6.9.10";

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

Deno.serve(async (req) => {
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
          message: "Email et identifiant ecole requis",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedIdentifier = String(schoolIdentifier).trim();

    console.log("verify-teacher-account:start", {
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
      console.error("verify-teacher-account:schoolError", schoolError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "school_lookup_error",
          message: "Erreur lors de la verification de l'ecole",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (!school) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "school_not_found",
          message: "Identifiant d'ecole invalide. Verifiez aupres de votre etablissement.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // 2) Teacher lookup: teachers are linked directly to schools
    const { data: teachers, error: teacherError } = await supabase
      .from("teachers")
      .select("id, firstname, lastname, email")
      .eq("school_id", school.id)
      .eq("email", normalizedEmail)
      .eq("archived", false)
      .limit(2);

    if (teacherError) {
      console.error("verify-teacher-account:teacherError", teacherError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "teacher_lookup_error",
          message: "Erreur lors de la verification du professeur",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    if ((teachers?.length ?? 0) > 1) {
      console.warn("verify-teacher-account:duplicateTeachers", {
        email: normalizedEmail,
        schoolId: school.id,
        count: teachers?.length,
      });
    }

    const teacher = teachers?.[0] ?? null;

    if (!teacher) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "teacher_not_found",
          message:
            "Aucun professeur trouve avec cet email pour cette ecole. Contactez votre etablissement.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    console.log("verify-teacher-account:teacherFound", {
      teacherId: teacher.id,
      schoolId: school.id,
    });

    // 3) Ensure app_users exists for this teacher
    const { data: existingAccount, error: accountError } = await supabase
      .from("app_users")
      .select("id, email, is_active, teacher_id, first_name, last_name, school_id")
      .eq("school_id", school.id)
      .eq("teacher_id", teacher.id)
      .maybeSingle();

    if (accountError) {
      console.error("verify-teacher-account:accountError", accountError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "account_lookup_error",
          message: "Erreur lors de la verification du compte",
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
          first_name: teacher.firstname,
          last_name: teacher.lastname,
          teacher_id: teacher.id,
          school_id: school.id,
          is_active: false,
        })
        .select("id, email, is_active, teacher_id, first_name, last_name, school_id")
        .single();

      if (createError) {
        console.error("verify-teacher-account:createAccountError", createError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "account_creation_error",
            message: "Erreur lors de la creation du compte. Contactez votre etablissement.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }

      account = newAccount;

      // Assign teacher role in app_user_roles
      const { error: roleError } = await supabase
        .from("app_user_roles")
        .insert({
          user_id: newAccount.id,
          role: "teacher",
          school_id: school.id,
        });

      if (roleError) {
        console.error("verify-teacher-account:roleAssignError", roleError);
      } else {
        console.log("verify-teacher-account:roleAssigned", { userId: newAccount.id, role: "teacher" });
      }
    } else {
      // Check if existing account has a role, if not assign one
      const { data: existingRole } = await supabase
        .from("app_user_roles")
        .select("id")
        .eq("user_id", account.id)
        .maybeSingle();

      if (!existingRole) {
        const { error: roleError } = await supabase
          .from("app_user_roles")
          .insert({
            user_id: account.id,
            role: "teacher",
            school_id: school.id,
          });

        if (roleError) {
          console.error("verify-teacher-account:existingAccountRoleAssignError", roleError);
        } else {
          console.log("verify-teacher-account:existingAccountRoleAssigned", { userId: account.id, role: "teacher" });
        }
      }
    }

    // 4) Already active
    if (account.is_active) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "already_active",
          message: "Votre compte est deja actif. Vous pouvez vous connecter directement.",
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
      console.error("verify-teacher-account:tokenError", tokenError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "token_error",
          message: "Erreur lors de la generation de l'invitation",
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

    // 7) Get SMTP configuration
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromAddress = Deno.env.get("SMTP_FROM_ADDRESS");
    const smtpSecure = Deno.env.get("SMTP_SECURE") === "true";
    const smtpFromName = Deno.env.get("SMTP_FROM_NAME") || "EduVate";

    if (!smtpHost || !smtpUsername || !smtpPassword || !smtpFromAddress) {
      console.warn("verify-teacher-account: SMTP not configured (test mode)");
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Email non envoye (configuration requise)",
          invitationUrl,
          schoolIdentifier: school.identifier,
          message: "Invitation creee (mode test).",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Activation de compte</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
                      <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">${school.name}</h2>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 32px 32px 0;">
                      <h1 style="margin: 0 0 16px; color: #1e293b; font-size: 24px; font-weight: 700; line-height: 1.3;">Bienvenue ${teacher.firstname} ${teacher.lastname} !</h1>
                      <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
                        Votre compte professeur est pret pour l'etablissement <strong>${school.name}</strong>.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 32px 24px;">
                      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px;">
                        <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Identifiant de l'ecole</p>
                        <p style="margin: 0; color: #1e293b; font-size: 15px; font-weight: 500;">${school.identifier}</p>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 32px;">
                      <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                        Pour activer votre compte et definir votre mot de passe, cliquez sur le bouton ci-dessous :
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 32px 32px; text-align: center;">
                      <a href="${invitationUrl}" 
                         style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                        Activer mon compte
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 32px 32px;">
                      <p style="margin: 0; color: #94a3b8; font-size: 13px; text-align: center;">
                        Ce lien est valable pendant 7 jours.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 24px 32px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                        ${new Date().getFullYear()} ${school.name} - Plateforme de gestion scolaire
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

    // Create SMTP transporter
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

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Probleme de connexion au serveur email",
          invitationUrl,
          schoolIdentifier: school.identifier,
          message: "Invitation creee. Reessayez ou contactez votre etablissement.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // Send email - use school name as sender for school-related emails
    try {
      await transporter.sendMail({
        from: `"${school.name}" <${smtpFromAddress}>`,
        to: normalizedEmail,
        subject: `Activez votre compte professeur - ${school.name}`,
        html: emailHtml,
      });

      console.log("verify-teacher-account: Email sent successfully to:", normalizedEmail);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email d'activation envoye ! Verifiez votre boite de reception.",
          schoolIdentifier: school.identifier,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    } catch (emailError) {
      console.error("verify-teacher-account:emailError", emailError);
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Probleme lors de l'envoi de l'email",
          invitationUrl,
          schoolIdentifier: school.identifier,
          message: "Invitation creee. Reessayez ou contactez votre etablissement.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }
  } catch (error) {
    console.error("verify-teacher-account:unhandled", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({
        success: false,
        error: "server_error",
        message: "Une erreur est survenue. Veuillez reessayer.",
        debug: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }
});
