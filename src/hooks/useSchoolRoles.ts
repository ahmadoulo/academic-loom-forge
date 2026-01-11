import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define all available permissions for schools
export const SCHOOL_PERMISSIONS = {
  // Dashboard
  'dashboard.view': { name: 'Voir le tableau de bord', description: 'Accéder au tableau de bord', category: 'Tableau de bord' },
  
  // Admissions
  'admissions.view': { name: 'Voir les admissions', description: 'Consulter les demandes d\'admission', category: 'Admissions' },
  'admissions.create': { name: 'Créer des admissions', description: 'Ajouter de nouvelles demandes', category: 'Admissions' },
  'admissions.update': { name: 'Modifier les admissions', description: 'Modifier les demandes existantes', category: 'Admissions' },
  'admissions.delete': { name: 'Supprimer les admissions', description: 'Supprimer des demandes', category: 'Admissions' },
  'admissions.convert': { name: 'Convertir en étudiant', description: 'Convertir une admission en étudiant', category: 'Admissions' },
  
  // Students
  'students.view': { name: 'Voir les étudiants', description: 'Consulter la liste des étudiants', category: 'Étudiants' },
  'students.create': { name: 'Créer des étudiants', description: 'Inscrire de nouveaux étudiants', category: 'Étudiants' },
  'students.update': { name: 'Modifier les étudiants', description: 'Modifier les informations', category: 'Étudiants' },
  'students.delete': { name: 'Archiver les étudiants', description: 'Archiver des étudiants', category: 'Étudiants' },
  
  // Teachers
  'teachers.view': { name: 'Voir les professeurs', description: 'Consulter la liste des professeurs', category: 'Professeurs' },
  'teachers.create': { name: 'Créer des professeurs', description: 'Ajouter de nouveaux professeurs', category: 'Professeurs' },
  'teachers.update': { name: 'Modifier les professeurs', description: 'Modifier les informations', category: 'Professeurs' },
  'teachers.delete': { name: 'Archiver les professeurs', description: 'Archiver des professeurs', category: 'Professeurs' },
  
  // Classes
  'classes.view': { name: 'Voir les classes', description: 'Consulter les classes', category: 'Classes' },
  'classes.create': { name: 'Créer des classes', description: 'Ajouter de nouvelles classes', category: 'Classes' },
  'classes.update': { name: 'Modifier les classes', description: 'Modifier les classes', category: 'Classes' },
  'classes.delete': { name: 'Archiver les classes', description: 'Archiver des classes', category: 'Classes' },
  
  // Subjects
  'subjects.view': { name: 'Voir les matières', description: 'Consulter les matières', category: 'Matières' },
  'subjects.create': { name: 'Créer des matières', description: 'Ajouter de nouvelles matières', category: 'Matières' },
  'subjects.update': { name: 'Modifier les matières', description: 'Modifier les matières', category: 'Matières' },
  'subjects.delete': { name: 'Archiver les matières', description: 'Archiver des matières', category: 'Matières' },
  
  // Attendance
  'attendance.view': { name: 'Voir les présences', description: 'Consulter les présences', category: 'Présences' },
  'attendance.manage': { name: 'Gérer les présences', description: 'Modifier les présences', category: 'Présences' },
  'justifications.view': { name: 'Voir les justificatifs', description: 'Consulter les justificatifs', category: 'Présences' },
  'justifications.manage': { name: 'Gérer les justificatifs', description: 'Approuver/refuser les justificatifs', category: 'Présences' },
  
  // Grades & Bulletin
  'grades.view': { name: 'Voir les notes', description: 'Consulter les notes', category: 'Notes' },
  'grades.manage': { name: 'Gérer les notes', description: 'Modifier les notes', category: 'Notes' },
  'bulletin.view': { name: 'Voir les bulletins', description: 'Consulter les bulletins', category: 'Notes' },
  'bulletin.generate': { name: 'Générer les bulletins', description: 'Générer des bulletins', category: 'Notes' },
  
  // Textbooks
  'textbooks.view': { name: 'Voir les cahiers de texte', description: 'Consulter les cahiers de texte', category: 'Suivi pédagogique' },
  'textbooks.manage': { name: 'Gérer les cahiers de texte', description: 'Modifier les cahiers de texte', category: 'Suivi pédagogique' },
  
  // Exams
  'exams.view': { name: 'Voir les documents examens', description: 'Consulter les documents d\'examens', category: 'Suivi pédagogique' },
  'exams.manage': { name: 'Gérer les documents examens', description: 'Approuver/rejeter les documents', category: 'Suivi pédagogique' },
  
  // Planning
  'timetable.view': { name: 'Voir l\'emploi du temps', description: 'Consulter l\'emploi du temps', category: 'Planning' },
  'timetable.manage': { name: 'Gérer l\'emploi du temps', description: 'Modifier l\'emploi du temps', category: 'Planning' },
  'classrooms.view': { name: 'Voir les salles', description: 'Consulter les salles', category: 'Planning' },
  'classrooms.create': { name: 'Créer des salles', description: 'Ajouter de nouvelles salles', category: 'Planning' },
  'classrooms.update': { name: 'Modifier les salles', description: 'Modifier les salles existantes', category: 'Planning' },
  'classrooms.delete': { name: 'Supprimer les salles', description: 'Supprimer des salles', category: 'Planning' },
  'cameras.view': { name: 'Voir les caméras', description: 'Consulter les caméras', category: 'Caméras' },
  'cameras.create': { name: 'Ajouter des caméras', description: 'Ajouter de nouvelles caméras', category: 'Caméras' },
  'cameras.update': { name: 'Modifier des caméras', description: 'Modifier les caméras existantes', category: 'Caméras' },
  'cameras.delete': { name: 'Supprimer des caméras', description: 'Supprimer des caméras', category: 'Caméras' },
  
  // Communication
  'notifications.view': { name: 'Voir les notifications', description: 'Consulter les notifications', category: 'Communication' },
  'notifications.send': { name: 'Envoyer des notifications', description: 'Envoyer des notifications', category: 'Communication' },
  'announcements.view': { name: 'Voir les annonces', description: 'Consulter les annonces', category: 'Communication' },
  'announcements.create': { name: 'Créer des annonces', description: 'Créer de nouvelles annonces', category: 'Communication' },
  'announcements.update': { name: 'Modifier les annonces', description: 'Modifier des annonces existantes', category: 'Communication' },
  'announcements.delete': { name: 'Supprimer les annonces', description: 'Supprimer des annonces', category: 'Communication' },
  'events.view': { name: 'Voir les événements', description: 'Consulter les événements', category: 'Communication' },
  'events.create': { name: 'Créer des événements', description: 'Créer de nouveaux événements', category: 'Communication' },
  'events.update': { name: 'Modifier les événements', description: 'Modifier des événements existants', category: 'Communication' },
  'events.delete': { name: 'Supprimer les événements', description: 'Supprimer des événements', category: 'Communication' },
  
  // Documents
  'documents.view': { name: 'Voir les demandes documents', description: 'Consulter les demandes de documents', category: 'Documents' },
  'documents.manage': { name: 'Gérer les demandes documents', description: 'Traiter les demandes de documents', category: 'Documents' },
  'templates.view': { name: 'Voir les modèles', description: 'Consulter les modèles de documents', category: 'Documents' },
  'templates.create': { name: 'Créer des modèles', description: 'Créer de nouveaux modèles', category: 'Documents' },
  'templates.update': { name: 'Modifier les modèles', description: 'Modifier des modèles existants', category: 'Documents' },
  'admin-documents.view': { name: 'Voir suivi documents administratifs', description: 'Consulter le suivi des documents administratifs', category: 'Documents' },
  'admin-documents.manage': { name: 'Gérer suivi documents administratifs', description: 'Gérer les documents administratifs des étudiants', category: 'Documents' },
  'templates.delete': { name: 'Supprimer les modèles', description: 'Supprimer des modèles', category: 'Documents' },
  
  // Calendar / Sessions
  'calendar.view': { name: 'Voir le calendrier', description: 'Consulter le calendrier des séances', category: 'Planning' },
  'calendar.create': { name: 'Créer des séances', description: 'Créer de nouvelles séances', category: 'Planning' },
  'calendar.update': { name: 'Modifier les séances', description: 'Modifier/déplacer des séances', category: 'Planning' },
  'calendar.delete': { name: 'Supprimer les séances', description: 'Supprimer des séances', category: 'Planning' },
  
  // Finance (if applicable)
  'fees.view': { name: 'Voir les frais', description: 'Consulter les frais scolaires', category: 'Finance' },
  'fees.manage': { name: 'Gérer les frais', description: 'Modifier les frais', category: 'Finance' },
  'payments.view': { name: 'Voir les paiements', description: 'Consulter les paiements', category: 'Finance' },
  'payments.manage': { name: 'Gérer les paiements', description: 'Enregistrer des paiements', category: 'Finance' },
  
  // Settings
  'settings.view': { name: 'Voir les informations école', description: 'Consulter les infos de l\'école', category: 'Paramètres' },
  'settings.manage': { name: 'Modifier les informations école', description: 'Modifier les infos de l\'école', category: 'Paramètres' },
  
  // Settings - Academic
  'semesters.view': { name: 'Voir les semestres', description: 'Consulter les semestres', category: 'Paramètres' },
  'semesters.manage': { name: 'Gérer les semestres', description: 'Créer/modifier les semestres', category: 'Paramètres' },
  'cycles.view': { name: 'Voir les cycles', description: 'Consulter les cycles', category: 'Paramètres' },
  'cycles.manage': { name: 'Gérer les cycles', description: 'Créer/modifier les cycles', category: 'Paramètres' },
  'options.view': { name: 'Voir les options', description: 'Consulter les options', category: 'Paramètres' },
  'options.manage': { name: 'Gérer les options', description: 'Créer/modifier les options', category: 'Paramètres' },
  
  // Settings - Accounts
  'student-accounts.view': { name: 'Voir comptes étudiants', description: 'Consulter les comptes étudiants', category: 'Paramètres' },
  'student-accounts.manage': { name: 'Gérer comptes étudiants', description: 'Gérer les comptes étudiants', category: 'Paramètres' },
  'teacher-accounts.view': { name: 'Voir comptes professeurs', description: 'Consulter les comptes professeurs', category: 'Paramètres' },
  'teacher-accounts.manage': { name: 'Gérer comptes professeurs', description: 'Gérer les comptes professeurs', category: 'Paramètres' },
  
  // Settings - Users & Roles
  'users.view': { name: 'Voir les utilisateurs', description: 'Consulter les comptes utilisateurs', category: 'Paramètres' },
  'users.manage': { name: 'Gérer les utilisateurs', description: 'Gérer les comptes utilisateurs', category: 'Paramètres' },
  'roles.view': { name: 'Voir les rôles', description: 'Consulter les rôles', category: 'Paramètres' },
  'roles.manage': { name: 'Gérer les rôles', description: 'Créer/modifier des rôles', category: 'Paramètres' },
} as const;

export type PermissionKey = keyof typeof SCHOOL_PERMISSIONS;

export interface SchoolRole {
  id: string;
  school_id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  permissions?: string[];
  users_count?: number;
}

export interface UserSchoolRole {
  id: string;
  user_id: string;
  school_role_id: string;
  school_id: string;
  granted_by: string | null;
  created_at: string;
  role?: SchoolRole;
}

// Default role templates for quick setup
export const DEFAULT_ROLE_TEMPLATES = {
  director: {
    name: 'Directeur des études',
    description: 'Gestion complète des aspects académiques',
    color: 'purple',
    permissions: [
      'dashboard.view', 'students.view', 'students.create', 'students.update',
      'teachers.view', 'teachers.create', 'teachers.update',
      'classes.view', 'classes.create', 'classes.update', 'classes.delete',
      'subjects.view', 'subjects.create', 'subjects.update',
      'attendance.view', 'attendance.manage', 'justifications.view', 'justifications.manage',
      'grades.view', 'grades.manage', 'bulletin.view', 'bulletin.generate',
      'timetable.view', 'timetable.manage', 'classrooms.view', 'classrooms.manage',
    ]
  },
  admission: {
    name: 'Responsable Admissions',
    description: 'Gestion des admissions et inscriptions',
    color: 'blue',
    permissions: [
      'dashboard.view', 'admissions.view', 'admissions.create', 'admissions.update', 
      'admissions.delete', 'admissions.convert', 'students.view', 'students.create',
      'classes.view',
    ]
  },
  accountant: {
    name: 'Comptable',
    description: 'Gestion financière et paiements',
    color: 'green',
    permissions: [
      'dashboard.view', 'students.view', 'fees.view', 'fees.manage', 
      'payments.view', 'payments.manage',
    ]
  },
  secretary: {
    name: 'Secrétaire',
    description: 'Gestion administrative et documents',
    color: 'orange',
    permissions: [
      'dashboard.view', 'students.view', 'teachers.view', 'classes.view',
      'documents.view', 'documents.manage', 'templates.view',
      'notifications.view', 'notifications.send', 'announcements.view',
    ]
  },
  supervisor: {
    name: 'Surveillant',
    description: 'Suivi des présences et discipline',
    color: 'red',
    permissions: [
      'dashboard.view', 'students.view', 'classes.view',
      'attendance.view', 'attendance.manage', 'justifications.view', 'justifications.manage',
    ]
  },
};

export function useSchoolRoles(schoolId?: string) {
  const [roles, setRoles] = useState<SchoolRole[]>([]);
  const [userRoles, setUserRoles] = useState<UserSchoolRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all roles for the school
  const fetchRoles = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('school_roles')
        .select('*')
        .eq('school_id', schoolId)
        .order('name');

      if (rolesError) throw rolesError;

      // Fetch permissions for each role
      const rolesWithPermissions = await Promise.all(
        (rolesData || []).map(async (role) => {
          const { data: perms } = await supabase
            .from('school_role_permissions')
            .select('permission_key')
            .eq('role_id', role.id);
          
          // Get users count for this role
          const { count } = await supabase
            .from('user_school_roles')
            .select('*', { count: 'exact', head: true })
            .eq('school_role_id', role.id);

          return {
            ...role,
            permissions: perms?.map(p => p.permission_key) || [],
            users_count: count || 0,
          };
        })
      );

      setRoles(rolesWithPermissions);
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  // Fetch user roles assignments
  const fetchUserRoles = useCallback(async () => {
    if (!schoolId) return;

    try {
      const { data, error } = await supabase
        .from('user_school_roles')
        .select(`
          *,
          role:school_roles(*)
        `)
        .eq('school_id', schoolId);

      if (error) throw error;
      setUserRoles(data || []);
    } catch (err: any) {
      console.error('Error fetching user roles:', err);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchRoles();
    fetchUserRoles();
  }, [fetchRoles, fetchUserRoles]);

  // Create a new role
  const createRole = async (data: {
    name: string;
    description?: string;
    color?: string;
    permissions: string[];
  }) => {
    if (!schoolId) return null;

    try {
      // Create the role
      const { data: newRole, error: roleError } = await supabase
        .from('school_roles')
        .insert({
          school_id: schoolId,
          name: data.name,
          description: data.description || null,
          color: data.color || 'blue',
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Add permissions
      if (data.permissions.length > 0) {
        const { error: permError } = await supabase
          .from('school_role_permissions')
          .insert(
            data.permissions.map(perm => ({
              role_id: newRole.id,
              permission_key: perm,
            }))
          );

        if (permError) throw permError;
      }

      toast.success('Rôle créé avec succès');
      await fetchRoles();
      return newRole;
    } catch (err: any) {
      console.error('Error creating role:', err);
      toast.error(err.message || 'Erreur lors de la création du rôle');
      return null;
    }
  };

  // Create role from template
  const createRoleFromTemplate = async (templateKey: keyof typeof DEFAULT_ROLE_TEMPLATES) => {
    const template = DEFAULT_ROLE_TEMPLATES[templateKey];
    return createRole(template);
  };

  // Update role
  const updateRole = async (roleId: string, data: {
    name?: string;
    description?: string;
    color?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('school_roles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roleId);

      if (error) throw error;
      toast.success('Rôle mis à jour');
      await fetchRoles();
    } catch (err: any) {
      console.error('Error updating role:', err);
      toast.error(err.message || 'Erreur lors de la mise à jour');
    }
  };

  // Delete role
  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('school_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      toast.success('Rôle supprimé');
      await fetchRoles();
    } catch (err: any) {
      console.error('Error deleting role:', err);
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  };

  // Update role permissions
  const updateRolePermissions = async (roleId: string, permissions: string[]) => {
    try {
      // Delete existing permissions
      await supabase
        .from('school_role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Add new permissions
      if (permissions.length > 0) {
        const { error } = await supabase
          .from('school_role_permissions')
          .insert(
            permissions.map(perm => ({
              role_id: roleId,
              permission_key: perm,
            }))
          );

        if (error) throw error;
      }

      toast.success('Permissions mises à jour');
      await fetchRoles();
    } catch (err: any) {
      console.error('Error updating permissions:', err);
      toast.error(err.message || 'Erreur lors de la mise à jour des permissions');
    }
  };

  // Toggle a single permission
  const toggleRolePermission = async (roleId: string, permissionKey: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const hasPermission = role.permissions?.includes(permissionKey);
    const newPermissions = hasPermission
      ? (role.permissions || []).filter(p => p !== permissionKey)
      : [...(role.permissions || []), permissionKey];

    await updateRolePermissions(roleId, newPermissions);
  };

  // Assign role to user
  const assignRoleToUser = async (userId: string, roleId: string, grantedBy: string) => {
    if (!schoolId) return;

    try {
      const { error } = await supabase
        .from('user_school_roles')
        .insert({
          user_id: userId,
          school_role_id: roleId,
          school_id: schoolId,
          granted_by: grantedBy,
        });

      if (error) throw error;
      toast.success('Rôle attribué');
      await fetchRoles();
      await fetchUserRoles();
    } catch (err: any) {
      console.error('Error assigning role:', err);
      toast.error(err.message || 'Erreur lors de l\'attribution');
    }
  };

  // Remove role from user
  const removeRoleFromUser = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_school_roles')
        .delete()
        .eq('user_id', userId)
        .eq('school_role_id', roleId);

      if (error) throw error;
      toast.success('Rôle retiré');
      await fetchRoles();
      await fetchUserRoles();
    } catch (err: any) {
      console.error('Error removing role:', err);
      toast.error(err.message || 'Erreur lors du retrait');
    }
  };

  // Get user's roles
  const getUserRoles = (userId: string) => {
    return userRoles.filter(ur => ur.user_id === userId);
  };

  // Check if user has permission
  const userHasPermission = (userId: string, permission: string): boolean => {
    const userAssignments = userRoles.filter(ur => ur.user_id === userId);
    return userAssignments.some(ur => {
      const role = roles.find(r => r.id === ur.school_role_id);
      return role?.permissions?.includes(permission);
    });
  };

  return {
    roles,
    userRoles,
    loading,
    error,
    createRole,
    createRoleFromTemplate,
    updateRole,
    deleteRole,
    updateRolePermissions,
    toggleRolePermission,
    assignRoleToUser,
    removeRoleFromUser,
    getUserRoles,
    userHasPermission,
    refetch: fetchRoles,
  };
}
