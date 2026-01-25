import { createClient } from "npm:@supabase/supabase-js@2";
import { validateEmail, validatePassword, hashPasswordSecure, validateSession } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetupRequest {
  email: string;
  password: string;
  sessionToken?: string; // Optional: for admin setting passwords
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, sessionToken }: SetupRequest = await req.json();

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return new Response(
        JSON.stringify({ error: emailValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.errors.join('. ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If sessionToken provided, validate admin access
    if (sessionToken) {
      const session = await validateSession(sessionToken, ['global_admin', 'school_admin']);
      if (!session.valid) {
        return new Response(
          JSON.stringify({ error: session.error }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Setting up password for: ${email}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Hash password with bcrypt
    const passwordHash = await hashPasswordSecure(password);

    // Update user password
    const { data, error } = await supabase
      .from('app_users')
      .update({ password_hash: passwordHash })
      .eq('email', email.toLowerCase().trim())
      .select('id');

    if (error) {
      console.error('Failed to update password:', error);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la mise à jour' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Password updated for ${email}`,
        updated: data?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
