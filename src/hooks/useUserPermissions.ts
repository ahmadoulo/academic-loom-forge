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
    if (!user?.id || !effectiveSchoolId) {
      setLoading(false);
      return;
    }

    // School admins and global admins have all permissions
    if (primaryRole === 'global_admin' || primaryRole === 'school_admin') {
      setPermissions(Object.keys(SCHOOL_PERMISSIONS));
      setLoading(false);
      return;
    }

    try {
      // Fetch user's school roles with their permissions
      const { data: userRoles, error } = await supabase
        .from('user_school_roles')
        .select(`
          school_role_id,
          role:school_roles(
            id,
            permissions:school_role_permissions(permission_key)
          )
        `)
        .eq('user_id', user.id)
        .eq('school_id', effectiveSchoolId);

      if (error) throw error;

      // Collect all permissions from all roles
      const allPermissions = new Set<string>();
      userRoles?.forEach((ur: any) => {
        ur.role?.permissions?.forEach((p: any) => {
          allPermissions.add(p.permission_key);
        });
      });

      setPermissions(Array.from(allPermissions));
    } catch (err) {
      console.error('Error fetching permissions:', err);
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
    if (primaryRole === 'global_admin' || primaryRole === 'school_admin') {
      return true;
    }

    const requiredPerms = SECTION_PERMISSIONS[section];
    if (!requiredPerms) return false;

    return requiredPerms.some(p => permissions.includes(p));
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
