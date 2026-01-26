import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  handleCors,
  validateSession,
  isGlobalAdmin,
  isSchoolAdmin,
  errorResponse,
} from "../_shared/auth.ts";

interface DeleteUserRequest {
  sessionToken: string;
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body: DeleteUserRequest = await req.json();
    const { sessionToken, userId } = body;

    if (!userId) {
      return errorResponse("ID utilisateur requis", 400);
    }

    // Validate session
    const session = await validateSession(sessionToken, {
      requiredRoles: ['global_admin', 'school_admin'],
    });

    if (!session.valid) {
      return errorResponse(session.error || "Non autorisé", session.status || 401);
    }

    console.log(`User ${session.userId} attempting to delete user ${userId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user to be deleted
    const { data: targetUser, error: fetchError } = await supabase
      .from("app_users")
      .select("id, school_id, email")
      .eq("id", userId)
      .single();

    if (fetchError || !targetUser) {
      console.error("User not found:", fetchError);
      return errorResponse("Utilisateur non trouvé", 404);
    }

    // Permission check: school_admin can only delete users from their school
    if (!isGlobalAdmin(session.roles || [])) {
      if (targetUser.school_id && !isSchoolAdmin(session.roles || [], targetUser.school_id)) {
        return errorResponse("Vous ne pouvez supprimer que les utilisateurs de votre école", 403);
      }
    }

    // Prevent self-deletion
    if (userId === session.userId) {
      return errorResponse("Vous ne pouvez pas supprimer votre propre compte", 400);
    }

    // Get target user roles to prevent deleting global_admin by non-global_admin
    const { data: targetRoles } = await supabase
      .from("app_user_roles")
      .select("role")
      .eq("user_id", userId);

    const targetIsGlobalAdmin = targetRoles?.some(r => r.role === 'global_admin');
    
    if (targetIsGlobalAdmin && !isGlobalAdmin(session.roles || [])) {
      return errorResponse("Seul un administrateur global peut supprimer un autre administrateur global", 403);
    }

    // Delete in order: user_school_roles -> app_user_roles -> app_users
    console.log("Deleting user_school_roles...");
    await supabase
      .from("user_school_roles")
      .delete()
      .eq("user_id", userId);

    console.log("Deleting app_user_roles...");
    const { error: rolesError } = await supabase
      .from("app_user_roles")
      .delete()
      .eq("user_id", userId);

    if (rolesError) {
      console.error("Error deleting roles:", rolesError);
      return errorResponse("Erreur lors de la suppression des rôles", 500);
    }

    console.log("Deleting app_user...");
    const { error: deleteError } = await supabase
      .from("app_users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return errorResponse("Erreur lors de la suppression de l'utilisateur", 500);
    }

    console.log(`User ${targetUser.email} deleted successfully by ${session.email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Utilisateur supprimé avec succès" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete user error:", error);
    return errorResponse("Erreur serveur lors de la suppression", 500);
  }
});
