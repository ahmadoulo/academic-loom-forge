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
    primarySchoolIdentifier: null,
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
          primarySchoolIdentifier: null,
          loading: false, 
          initialized: true 
        }));
        return;
      }

      // Update session token and school identifier if refreshed
      if (data.sessionToken !== sessionToken) {
        localStorage.setItem(SESSION_KEY, data.sessionToken);
      }
      if (data.primarySchoolIdentifier) {
        localStorage.setItem('app_school_identifier', data.primarySchoolIdentifier);
      }

      setState({
        user: data.user,
        roles: data.roles,
        primaryRole: data.primaryRole,
        primarySchoolId: data.primarySchoolId,
        primarySchoolIdentifier: data.primarySchoolIdentifier,
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
        primarySchoolIdentifier: null,
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
        toast.error('Email ou mot de passe incorrect');
        return false;
      }

      if (data.error) {
        // Use friendly message for common auth errors
        const errorMessage = data.error === 'Email ou mot de passe incorrect' 
          ? data.error 
          : data.error;
        toast.error(errorMessage);
        return false;
      }

      // Save session token and school identifier
      localStorage.setItem(SESSION_KEY, data.sessionToken);
      if (data.primarySchoolIdentifier) {
        localStorage.setItem('app_school_identifier', data.primarySchoolIdentifier);
      }

      setState({
        user: data.user,
        roles: data.roles,
        primaryRole: data.primaryRole,
        primarySchoolId: data.primarySchoolId,
        primarySchoolIdentifier: data.primarySchoolIdentifier,
        loading: false,
        initialized: true,
      });

      toast.success('Connexion réussie');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Email ou mot de passe incorrect');
      return false;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('app_school_identifier');
    setState({
      user: null,
      roles: [],
      primaryRole: null,
      primarySchoolId: null,
      primarySchoolIdentifier: null,
      loading: false,
      initialized: true,
    });
    navigate('/auth');
    toast.success('Déconnexion réussie');
  }, [navigate]);

  // Create user (for admins)
  const createUser = useCallback(async (userData: CreateUserData, createdBy: string) => {
    try {
      const sessionToken = localStorage.getItem(SESSION_KEY);
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: { ...userData, createdBy, sessionToken }
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
  const resetPassword = useCallback(async (userId: string, _requestedBy: string) => {
    try {
      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");
      
      if (!sessionToken) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return null;
      }
      
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { sessionToken, userId }
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

  // Get redirect path based on role - uses school identifier for school routes
  const getRedirectPath = useCallback((): string => {
    if (!state.user || !state.primaryRole) return '/auth';

    switch (state.primaryRole) {
      case 'global_admin':
        return '/admin';
      case 'school_admin':
      case 'school_staff':
        // Use school identifier for school-based roles
        return state.primarySchoolIdentifier ? `/school/${state.primarySchoolIdentifier}` : '/auth';
      case 'teacher':
        return state.user.teacher_id ? `/teacher/${state.user.teacher_id}` : '/auth';
      case 'student':
        return state.user.student_id ? `/student/${state.user.student_id}` : '/auth';
      default:
        // Fallback for any school-related role with school identifier
        if (state.primarySchoolIdentifier) {
          return `/school/${state.primarySchoolIdentifier}`;
        }
        return '/auth';
    }
  }, [state.user, state.primaryRole, state.primarySchoolIdentifier]);

  return {
    user: state.user,
    roles: state.roles,
    primaryRole: state.primaryRole,
    primarySchoolId: state.primarySchoolId,
    primarySchoolIdentifier: state.primarySchoolIdentifier,
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
