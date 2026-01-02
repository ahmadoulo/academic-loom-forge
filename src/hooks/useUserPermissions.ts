import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SCHOOL_PERMISSIONS, PermissionKey } from './useSchoolRoles';

// Map sidebar sections to required permissions
export const SECTION_PERMISSIONS: Record<string, string[]> = {
  'analytics': ['dashboard.view'],
  'calendar': ['dashboard.view'],
  'students': ['students.view'],
  'admissions': ['admissions.view'],
  'classes': ['classes.view'],
  'teachers': ['teachers.view'],
  'subjects': ['subjects.view'],
  'attendance': ['attendance.view'],
  'justifications': ['justifications.view'],
  'grades': ['grades.view'],
  'bulletin': ['bulletin.view'],
  'textbooks': ['dashboard.view'],
  'exams': ['grades.view'],
  'timetable': ['timetable.view'],
  'classrooms': ['classrooms.view'],
  'cameras': ['dashboard.view'],
  'notifications': ['notifications.view'],
  'announcements': ['announcements.view'],
  'events': ['events.view'],
  'document-requests': ['documents.view'],
  'documents': ['templates.view'],
  'year-transition': ['settings.manage'],
  'subscription': ['settings.view'],
  'settings': ['settings.view'],
};

export function useUserPermissions(schoolId?: string) {
  const { user, primaryRole, primarySchoolId } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveSchoolId = schoolId || primarySchoolId;

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      console.log('[Permissions] No user ID, skipping fetch');
      setLoading(false);
      return;
    }

    if (!effectiveSchoolId) {
      console.log('[Permissions] No school ID, skipping fetch');
      setLoading(false);
      return;
    }

    // School admins and global admins have all permissions
    if (primaryRole === 'global_admin' || primaryRole === 'school_admin') {
      console.log('[Permissions] Admin role detected, granting all permissions');
      setPermissions(Object.keys(SCHOOL_PERMISSIONS));
      setLoading(false);
      return;
    }

    try {
      console.log('[Permissions] Fetching permissions for user:', user.id, 'school:', effectiveSchoolId);
      
      // First get the user's school roles
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_school_roles')
        .select('school_role_id')
        .eq('user_id', user.id)
        .eq('school_id', effectiveSchoolId);

      if (userRolesError) {
        console.error('[Permissions] Error fetching user roles:', userRolesError);
        throw userRolesError;
      }

      console.log('[Permissions] User roles found:', userRoles);

      if (!userRoles || userRoles.length === 0) {
        console.log('[Permissions] No roles assigned to user');
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Get the role IDs
      const roleIds = userRoles.map(ur => ur.school_role_id);
      console.log('[Permissions] Role IDs:', roleIds);

      // Fetch permissions for these roles
      const { data: rolePermissions, error: permError } = await supabase
        .from('school_role_permissions')
        .select('permission_key')
        .in('role_id', roleIds);

      if (permError) {
        console.error('[Permissions] Error fetching role permissions:', permError);
        throw permError;
      }

      console.log('[Permissions] Role permissions found:', rolePermissions);

      // Collect all permissions
      const allPermissions = rolePermissions?.map(p => p.permission_key) || [];
      const uniquePermissions = [...new Set(allPermissions)];
      
      console.log('[Permissions] Final permissions:', uniquePermissions);
      setPermissions(uniquePermissions);
    } catch (err) {
      console.error('[Permissions] Error:', err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, effectiveSchoolId, primaryRole]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: PermissionKey | string): boolean => {
    // Admins have all permissions
    if (primaryRole === 'global_admin' || primaryRole === 'school_admin') {
      return true;
    }
    return permissions.includes(permission);
  }, [permissions, primaryRole]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((perms: (PermissionKey | string)[]): boolean => {
    if (primaryRole === 'global_admin' || primaryRole === 'school_admin') {
      return true;
    }
    return perms.some(p => permissions.includes(p));
  }, [permissions, primaryRole]);

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((perms: (PermissionKey | string)[]): boolean => {
    if (primaryRole === 'global_admin' || primaryRole === 'school_admin') {
      return true;
    }
    return perms.every(p => permissions.includes(p));
  }, [permissions, primaryRole]);

  // Check if user can access a specific section
  const canAccessSection = useCallback((section: string): boolean => {
    // Admins have access to all sections
    if (primaryRole === 'global_admin' || primaryRole === 'school_admin') {
      return true;
    }

    const requiredPerms = SECTION_PERMISSIONS[section];
    if (!requiredPerms) {
      console.log('[Permissions] No permissions defined for section:', section);
      return false;
    }

    const hasAccess = requiredPerms.some(p => permissions.includes(p));
    console.log('[Permissions] Section:', section, 'Required:', requiredPerms, 'Has access:', hasAccess);
    return hasAccess;
  }, [permissions, primaryRole]);

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessSection,
    refetch: fetchPermissions,
  };
}
