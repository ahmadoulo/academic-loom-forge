import { createClient } from "npm:@supabase/supabase-js@2";
import { validateSession } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ToggleMFARequest {
  sessionToken: string;
  enabled: boolean;
  mfaType?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionToken, enabled, mfaType = "email" }: ToggleMFARequest = await req.json();

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: "Session requise" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate session
    const sessionValidation = await validateSession(sessionToken, supabase);
    if (!sessionValidation.valid || !sessionValidation.user) {
      return new Response(
        JSON.stringify({ error: "Session invalide ou expirée" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = sessionValidation.user.id;

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
      return new Response(
        JSON.stringify({ error: "Erreur lors de la mise à jour des paramètres MFA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
