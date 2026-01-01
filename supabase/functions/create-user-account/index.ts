import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "global_admin" | "school_admin" | "school_staff" | "teacher" | "student";
  schoolId?: string;
  password?: string;
  createdBy?: string;
  schoolRoleId?: string; // Custom school role ID
}

// Roles that require a school_id
const SCHOOL_BOUND_ROLES = ["school_admin", "school_staff", "teacher", "student"];

// Hash password using SHA-256 (Deno compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CreateUserRequest = await req.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      role,
      schoolId,
      password,
      createdBy,
      schoolRoleId,
    } = body;

    // Validation
    if (!email || !firstName || !lastName || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, prénom, nom et rôle sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role requirements - school-bound roles require schoolId
    if (SCHOOL_BOUND_ROLES.includes(role) && !schoolId) {
      return new Response(
        JSON.stringify({ error: "school_id est requis pour ce rôle" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Creating user account for: ${email} with role: ${role}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Un compte existe déjà avec cet email' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare user data
    let passwordHash: string | null = null;
    let isActive = false;

    // Password is set at creation time
    if (!password) {
      return new Response(
        JSON.stringify({ error: "Mot de passe requis pour créer un compte" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    passwordHash = await hashPassword(password);
    isActive = true;

    // Determine school_id for school-bound roles
    const userSchoolId = SCHOOL_BOUND_ROLES.includes(role) ? (schoolId || null) : null;

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('app_users')
      .insert({
        email: email.toLowerCase().trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone?.trim() || null,
        school_id: userSchoolId,
        teacher_id: null,
        student_id: null,
        password_hash: passwordHash,
        invitation_token: null,
        invitation_expires_at: null,
        is_active: isActive,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create user:', createError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du compte', details: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User created with ID: ${newUser.id}`);

    // Assign app_user_role
    const { error: roleError } = await supabase
      .from("app_user_roles")
      .insert({
        user_id: newUser.id,
        role,
        school_id: userSchoolId,
        granted_by: createdBy || null,
      });

    if (roleError) {
      console.error('Failed to assign app role:', roleError);
      // Rollback user creation
      await supabase.from('app_users').delete().eq('id', newUser.id);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'attribution du rôle', details: roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If schoolRoleId is provided, also assign the custom school role
    if (schoolRoleId && userSchoolId) {
      const { error: schoolRoleError } = await supabase
        .from("user_school_roles")
        .insert({
          user_id: newUser.id,
          school_role_id: schoolRoleId,
          school_id: userSchoolId,
          granted_by: createdBy || null,
        });

      if (schoolRoleError) {
        console.error('Failed to assign school role:', schoolRoleError);
        // We don't rollback here since the user was created successfully
        // Just log the error
      } else {
        console.log(`Custom school role ${schoolRoleId} assigned to user ${newUser.id}`);
      }
    }

    console.log(`User ${email} created successfully with ID: ${newUser.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          is_active: newUser.is_active,
        },
        role,
        schoolRoleId,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error('Create user error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de la création du compte', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
