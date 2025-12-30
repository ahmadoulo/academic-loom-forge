import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoginCredentials {
  email: string;
  password: string;
}

interface CreateUserCredentials {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  school_id?: string;
}

interface UserCredential {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  school_id?: string;
  is_active: boolean;
  last_login?: string;
  teacher_id?: string;
  student_id?: string;
}

export const useCustomAuth = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserCredential | null>(null);
  const [initialized, setInitialized] = useState(false);

  const createUserCredential = async (userData: CreateUserCredentials) => {
    try {
      setLoading(true);
      
      // Use the create-user-account edge function
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.role,
          schoolId: userData.school_id,
          password: userData.password,
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      toast.success('Utilisateur créé avec succès');
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de l\'utilisateur';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = async ({ email, password }: LoginCredentials) => {
    try {
      setLoading(true);
      console.log('🔐 Tentative de connexion pour:', email);

      // Use the authenticate-user edge function
      const { data, error } = await supabase.functions.invoke('authenticate-user', {
        body: { email, password }
      });

      if (error) {
        console.error('❌ Erreur d\'authentification:', error);
        toast.error('Email ou mot de passe incorrect');
        throw error;
      }

      if (data.error) {
        console.error('❌ Erreur retournée:', data.error);
        toast.error(data.error);
        throw new Error(data.error);
      }

      console.log('✅ Authentification réussie:', data);

      const userData: UserCredential = {
        id: data.user.id,
        email: data.user.email,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        role: data.primaryRole,
        school_id: data.primarySchoolId,
        teacher_id: data.user.teacher_id,
        student_id: data.user.student_id,
        is_active: data.user.is_active,
        last_login: new Date().toISOString(),
      };

      // Store session
      localStorage.setItem('customAuthUser', JSON.stringify(userData));
      localStorage.setItem('sessionToken', data.sessionToken);
      setUser(userData);

      toast.success('Connexion réussie !');
      
      // Redirect based on role
      setTimeout(() => {
        if (data.primaryRole === 'global_admin' || data.primaryRole === 'admin') {
          window.location.href = '/admin';
        } else if (data.primaryRole === 'school_admin' && data.primarySchoolId) {
          window.location.href = `/school/${data.primarySchoolId}`;
        } else if (data.primaryRole === 'teacher' && data.user.teacher_id) {
          window.location.href = `/teacher/${data.user.teacher_id}`;
        } else if (data.primaryRole === 'student' && data.user.student_id) {
          window.location.href = `/student/${data.user.student_id}`;
        } else {
          window.location.href = '/dashboard';
        }
      }, 500);
      
      return userData;
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('customAuthUser');
    localStorage.removeItem('sessionToken');
    
    toast.success('Déconnexion réussie');
    window.location.replace('/auth');
  }, []);

  const checkAuthStatus = useCallback(() => {
    if (initialized) return;
    
    const storedUser = localStorage.getItem('customAuthUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('customAuthUser');
        setUser(null);
      }
    }
    setInitialized(true);
  }, [initialized]);

  useEffect(() => {
    if (!initialized) {
      checkAuthStatus();
    }
  }, [checkAuthStatus, initialized]);

  return {
    user,
    loading: loading || !initialized,
    createUserCredential,
    loginWithCredentials,
    logout,
    checkAuthStatus,
  };
};
