import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  appUrl?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, appUrl }: RequestBody = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email requis" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("request-password-reset: Processing for email:", normalizedEmail);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists in app_users
    const { data: user, error: userError } = await supabase
      .from("app_users")
      .select(
        "id, email, first_name, last_name, school_id, is_active, schools!app_users_school_id_fkey(name, identifier)"
      )
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userError) {
      console.error("request-password-reset: Error fetching user:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur lors de la vérification" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user) {
      console.log("request-password-reset: User not found:", normalizedEmail);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "not_found",
          message: "Aucun compte trouvé avec cette adresse email. Veuillez contacter votre administration."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user.is_active) {
      console.log("request-password-reset: User inactive:", normalizedEmail);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "inactive",
          message: "Votre compte est inactif. Veuillez contacter votre administration."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    const resetExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    // Update user with reset token
    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        invitation_token: resetToken,
        invitation_expires_at: resetExpiresAt.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("request-password-reset: Error updating token:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur lors de la génération du lien" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send reset email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("request-password-reset: RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Service email non configuré" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Build reset URL
    const baseUrl =
      (appUrl && appUrl.startsWith("http") ? appUrl : undefined) ??
      req.headers.get("origin") ??
      Deno.env.get("SITE_URL") ??
      "https://eduvate.lovable.app";

    const resetUrl = `${baseUrl}/set-password?token=${resetToken}`;

    const schoolName = (user.schools as any)?.name || "votre établissement";
    const schoolIdentifier = (user.schools as any)?.identifier || "";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Réinitialisation de mot de passe</h1>
        </div>
        
        <p style="color: #555; font-size: 16px;">Bonjour ${user.first_name} ${user.last_name},</p>
        
        <p style="color: #555; font-size: 16px;">
          Vous avez demandé la réinitialisation de votre mot de passe pour votre compte EduVate.
        </p>
        
        <p style="color: #555; font-size: 16px;">
          <strong>Établissement :</strong> ${schoolName}
          ${schoolIdentifier ? `<br/><strong>Identifiant école :</strong> ${schoolIdentifier}` : ""}
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 14px 28px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        
        <p style="color: #888; font-size: 14px;">
          Ce lien est valable pendant 2 heures. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} EduVate - Plateforme de gestion scolaire
        </p>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "EduVate <onboarding@resend.dev>",
      to: [user.email],
      subject: "Réinitialisation de votre mot de passe EduVate",
      html: emailHtml,
    });

    if (emailError) {
      console.error("request-password-reset: Email send error:", emailError);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur lors de l'envoi de l'email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("request-password-reset: Reset email sent to:", normalizedEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Un email de réinitialisation a été envoyé à votre adresse." 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("request-password-reset: Unhandled error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Une erreur est survenue" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
