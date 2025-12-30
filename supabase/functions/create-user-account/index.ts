import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'global_admin' | 'admin' | 'school_admin' | 'teacher' | 'student';
  schoolId?: string;
  teacherId?: string;
  studentId?: string;
  password?: string; // If provided, set password directly
  sendInvitation?: boolean; // If true, generate invitation token
  createdBy: string; // ID of the user creating this account
}

function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

serve(async (req) => {
  // Handle CORS preflight
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
      teacherId,
      studentId,
      password,
      sendInvitation,
      createdBy
    } = body;

    // Validation
    if (!email || !firstName || !lastName || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, prénom, nom et rôle sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role requirements
    if (['school_admin', 'teacher', 'student'].includes(role) && !schoolId) {
      return new Response(
        JSON.stringify({ error: 'school_id est requis pour ce rôle' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating user account for: ${email} with role: ${role}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Un compte existe déjà avec cet email' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare user data
    let passwordHash: string | null = null;
    let invitationToken: string | null = null;
    let invitationExpiresAt: string | null = null;
    let generatedPassword: string | null = null;
    let isActive = false;

    if (password) {
      // Direct password set
      passwordHash = await bcrypt.hash(password);
      isActive = true;
    } else if (sendInvitation) {
      // Generate invitation token
      invitationToken = crypto.randomUUID();
      invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    } else {
      // Generate random password
      generatedPassword = generatePassword();
      passwordHash = await bcrypt.hash(generatedPassword);
      isActive = true;
    }

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('app_users')
      .insert({
        email: email.toLowerCase().trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone?.trim() || null,
        school_id: schoolId || null,
        teacher_id: teacherId || null,
        student_id: studentId || null,
        password_hash: passwordHash,
        invitation_token: invitationToken,
        invitation_expires_at: invitationExpiresAt,
        is_active: isActive
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create user:', createError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du compte' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign role
    const { error: roleError } = await supabase
      .from('app_user_roles')
      .insert({
        user_id: newUser.id,
        role: role,
        school_id: ['school_admin', 'teacher', 'student'].includes(role) ? schoolId : null,
        granted_by: createdBy
      });

    if (roleError) {
      console.error('Failed to assign role:', roleError);
      // Rollback user creation
      await supabase.from('app_users').delete().eq('id', newUser.id);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'attribution du rôle' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
          is_active: newUser.is_active
        },
        role,
        generatedPassword, // Only returned if auto-generated (copy to clipboard)
        invitationToken, // Only returned if invitation was requested
        invitationExpiresAt
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create user error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de la création du compte' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
