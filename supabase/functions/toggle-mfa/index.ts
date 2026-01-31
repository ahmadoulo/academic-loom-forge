import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ToggleMFARequest {
  userId: string;
  sessionToken: string;
  enabled: boolean;
  mfaType?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, sessionToken, enabled, mfaType = "email" }: ToggleMFARequest = await req.json();

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: "Session requise" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate session by checking the token matches for this user
    const { data: user, error: userError } = await supabase
      .from("app_users")
      .select("id, email, is_active, session_token, session_expires_at")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("User not found:", userError);
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if session token matches
    if (user.session_token !== sessionToken) {
      console.error("Session token mismatch");
      return new Response(
        JSON.stringify({ error: "Session invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if session is expired
    if (user.session_expires_at && new Date(user.session_expires_at) < new Date()) {
      console.error("Session expired");
      return new Response(
        JSON.stringify({ error: "Session expirée" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if account is active
    if (!user.is_active) {
      return new Response(
        JSON.stringify({ error: "Compte désactivé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update MFA settings
    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        mfa_enabled: enabled,
        mfa_type: enabled ? mfaType : null,
        mfa_code: null,
        mfa_code_expires_at: null,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to update MFA settings:", updateError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la mise à jour des paramètres MFA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`MFA ${enabled ? "enabled" : "disabled"} for user ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        mfaEnabled: enabled,
        message: enabled
          ? "Authentification à deux facteurs activée"
          : "Authentification à deux facteurs désactivée",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Toggle MFA error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});