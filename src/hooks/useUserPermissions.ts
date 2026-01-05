import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SCHOOL_PERMISSIONS, PermissionKey } from './useSchoolRoles';

const SESSION_KEY = 'app_session_token';

// Map sidebar sections to required permissions
export const SECTION_PERMISSIONS: Record<string, string[]> = {
  // Dashboard / home
  analytics: ['dashboard.view'],
  calendar: ['dashboard.view'],

  // Gestion académique
  students: ['students.view'],
  admissions: ['admissions.view'],
  classes: ['classes.view'],
  teachers: ['teachers.view'],
  subjects: ['subjects.view'],

  // Suivi pédagogique
  attendance: ['attendance.view'],
  justifications: ['justifications.view'],
  grades: ['grades.view'],
  bulletin: ['bulletin.view'],
  textbooks: ['textbooks.view'],
  exams: ['exams.view'],

  // Planning & salles
  timetable: ['timetable.view'],
  classrooms: ['classrooms.view'],
  cameras: ['cameras.view'],

  // Communication
  notifications: ['notifications.view'],
  announcements: ['announcements.view'],
  events: ['events.view'],

  // Documents
  'document-requests': ['documents.view'],
  documents: ['documents.view', 'templates.view'],

  // Administration
  'year-transition': ['settings.manage'],
  subscription: ['settings.view'],
  settings: ['settings.view'],
};

export function useUserPermissions(schoolId?: string) {
  const { user, primaryRole, primarySchoolId } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // The app routes use the school's "identifier" (ex: ESTEM01) while the DB uses a UUID.
  // When callers accidentally pass an identifier here, permissions will always be empty.
  const isUuid = (value?: string | null) =>
    !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const effectiveSchoolId = isUuid(schoolId) ? schoolId : primarySchoolId;

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    if (!effectiveSchoolId) {
      setLoading(false);
      return;
    }

    // School admins and global admins have all permissions
    if (primaryRole === 'global_admin' || primaryRole === 'school_admin') {
      setPermissions(Object.keys(SCHOOL_PERMISSIONS));
      setLoading(false);
      return;
    }

    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (!sessionToken) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-user-permissions', {
        body: {
          sessionToken,
          schoolId: effectiveSchoolId,
        },
      });

      if (error) throw error;
      if (!data?.success) {
        setPermissions([]);
        return;
      }

      const uniquePermissions = [...new Set((data.permissions as string[]) || [])];
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
      return false;
    }

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

