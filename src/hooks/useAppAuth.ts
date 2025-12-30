import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  AppUser, 
  UserRole, 
  AppRole, 
  AuthState, 
  LoginCredentials,
  CreateUserData 
} from '@/types/auth';

const SESSION_KEY = 'app_session_token';

export function useAppAuth() {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    roles: [],
    primaryRole: null,
    primarySchoolId: null,
    loading: true,
    initialized: false,
  });

  // Validate session on mount
  const validateSession = useCallback(async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    
    if (!sessionToken) {
      setState(prev => ({ ...prev, loading: false, initialized: true }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('validate-session', {
        body: { sessionToken }
      });

      if (error || !data?.valid) {
        localStorage.removeItem(SESSION_KEY);
        setState(prev => ({ 
          ...prev, 
          user: null, 
          roles: [], 
          primaryRole: null, 
          primarySchoolId: null,
          loading: false, 
          initialized: true 
        }));
        return;
      }

      // Update session token if refreshed
      if (data.sessionToken !== sessionToken) {
        localStorage.setItem(SESSION_KEY, data.sessionToken);
      }

      setState({
        user: data.user,
        roles: data.roles,
        primaryRole: data.primaryRole,
        primarySchoolId: data.primarySchoolId,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      console.error('Session validation error:', error);
      localStorage.removeItem(SESSION_KEY);
      setState(prev => ({ 
        ...prev, 
        user: null, 
        roles: [], 
        primaryRole: null, 
        primarySchoolId: null,
        loading: false, 
        initialized: true 
      }));
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  // Login
  const login = useCallback(async ({ email, password }: LoginCredentials): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('authenticate-user', {
        body: { email, password }
      });

      if (error) {
        console.error('Login error:', error);
        toast.error('Erreur de connexion');
        return false;
      }

      if (data.error) {
        toast.error(data.error);
        return false;
      }

      // Save session token
      localStorage.setItem(SESSION_KEY, data.sessionToken);

      setState({
        user: data.user,
        roles: data.roles,
        primaryRole: data.primaryRole,
        primarySchoolId: data.primarySchoolId,
        loading: false,
        initialized: true,
      });

      toast.success('Connexion réussie');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erreur de connexion');
      return false;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setState({
      user: null,
      roles: [],
      primaryRole: null,
      primarySchoolId: null,
      loading: false,
      initialized: true,
    });
    navigate('/auth');
    toast.success('Déconnexion réussie');
  }, [navigate]);

  // Create user (for admins)
  const createUser = useCallback(async (userData: CreateUserData, createdBy: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: { ...userData, createdBy }
      });

      if (error) {
        console.error('Create user error:', error);
        toast.error('Erreur lors de la création du compte');
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      // If password was generated, copy to clipboard
      if (data.generatedPassword) {
        await navigator.clipboard.writeText(data.generatedPassword);
        toast.success('Compte créé. Mot de passe copié dans le presse-papiers.');
      } else if (data.invitationToken) {
        toast.success('Compte créé. Un email d\'invitation sera envoyé.');
      } else {
        toast.success('Compte créé avec succès');
      }

      return data;
    } catch (error) {
      console.error('Create user error:', error);
      toast.error('Erreur lors de la création du compte');
      return null;
    }
  }, []);

  // Reset password (for admins)
  const resetPassword = useCallback(async (userId: string, requestedBy: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId, requestedBy }
      });

      if (error) {
        console.error('Reset password error:', error);
        toast.error('Erreur lors de la réinitialisation');
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      // Copy new password to clipboard
      if (data.newPassword) {
        await navigator.clipboard.writeText(data.newPassword);
        toast.success('Mot de passe réinitialisé et copié dans le presse-papiers');
      }

      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Erreur lors de la réinitialisation');
      return null;
    }
  }, []);

  // Set password (for invitation)
  const setPassword = useCallback(async (token: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('set-user-password', {
        body: { token, password }
      });

      if (error) {
        console.error('Set password error:', error);
        toast.error('Erreur lors de la définition du mot de passe');
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      toast.success(data.message);
      return data;
    } catch (error) {
      console.error('Set password error:', error);
      toast.error('Erreur lors de la définition du mot de passe');
      return null;
    }
  }, []);

  // Check if user has a specific role
  const hasRole = useCallback((role: AppRole, schoolId?: string): boolean => {
    return state.roles.some(r => {
      if (r.role !== role) return false;
      if (schoolId && r.school_id !== schoolId) return false;
      return true;
    });
  }, [state.roles]);

  // Get redirect path based on role
  const getRedirectPath = useCallback((): string => {
    if (!state.user || !state.primaryRole) return '/auth';

    switch (state.primaryRole) {
      case 'global_admin':
      case 'admin':
        return '/admin';
      case 'school_admin':
        return state.primarySchoolId ? `/school/${state.primarySchoolId}` : '/auth';
      case 'teacher':
        return state.user.teacher_id ? `/teacher/${state.user.teacher_id}` : '/auth';
      case 'student':
        return state.user.student_id ? `/student/${state.user.student_id}` : '/auth';
      default:
        return '/auth';
    }
  }, [state.user, state.primaryRole, state.primarySchoolId]);

  return {
    user: state.user,
    roles: state.roles,
    primaryRole: state.primaryRole,
    primarySchoolId: state.primarySchoolId,
    loading: state.loading,
    initialized: state.initialized,
    isAuthenticated: !!state.user,
    login,
    logout,
    createUser,
    resetPassword,
    setPassword,
    hasRole,
    getRedirectPath,
    validateSession,
  };
}
