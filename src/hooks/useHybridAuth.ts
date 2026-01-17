import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { toast } from 'sonner';

export const useHybridAuth = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const customAuth = useCustomAuth();

  // Vérifier l'authentification Supabase d'abord, puis le système custom
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // 1. Vérifier l'auth Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Récupérer le profil depuis app_users
        const { data: profile } = await supabase
          .from('app_users')
          .select('*, app_user_roles(role)')
          .eq('email', session.user.email)
          .single();
          
        if (profile) {
          const roles = profile.app_user_roles as { role: string }[] | null;
          const primaryRole = roles && roles.length > 0 ? roles[0].role : 'school_admin';
          
          const supabaseUser = {
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: primaryRole,
            school_id: profile.school_id,
            is_active: profile.is_active,
            auth_type: 'supabase'
          };
          
          setUser(supabaseUser);
          localStorage.setItem('hybridAuthUser', JSON.stringify(supabaseUser));
          return supabaseUser;
        }
      }
      
      // 2. Vérifier le système custom si pas d'auth Supabase
      const storedUser = localStorage.getItem('customAuthUser');
      if (storedUser) {
        const customUser = JSON.parse(storedUser);
        const customUserWithType = {
          ...customUser,
          auth_type: 'custom'
        };
        setUser(customUserWithType);
        return customUserWithType;
      }
      
      setUser(null);
      return null;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = async ({ email, password }: { email: string; password: string }) => {
    try {
      setLoading(true);
      
      // 1. Essayer d'abord l'auth Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data.user && !error) {
        // Récupérer le profil depuis app_users
        const { data: profile } = await supabase
          .from('app_users')
          .select('*, app_user_roles(role)')
          .eq('email', data.user.email)
          .single();
          
        if (profile) {
          const roles = profile.app_user_roles as { role: string }[] | null;
          const primaryRole = roles && roles.length > 0 ? roles[0].role : 'school_admin';
          
          const supabaseUser = {
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: primaryRole,
            school_id: profile.school_id,
            is_active: profile.is_active,
            auth_type: 'supabase'
          };
          
          setUser(supabaseUser);
          localStorage.setItem('hybridAuthUser', JSON.stringify(supabaseUser));
          toast.success('Connexion réussie');
          return supabaseUser;
        }
      }
      
      // 2. Si échec Supabase, essayer le système custom
      const customResult = await customAuth.loginWithCredentials({ email, password });
      if (customResult) {
        const customUserWithType = {
          ...customResult,
          auth_type: 'custom'
        };
        setUser(customUserWithType);
        return customUserWithType;
      }
      
      throw new Error('Identifiants incorrects');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Déconnexion Supabase
      await supabase.auth.signOut();
      
      // Déconnexion custom
      customAuth.logout();
      
      setUser(null);
      localStorage.removeItem('hybridAuthUser');
      localStorage.removeItem('customAuthUser');
      
      toast.success('Déconnexion réussie');
      window.location.href = '/auth';
    } catch (error) {
      // Silent error handling
    }
  };

  useEffect(() => {
    checkAuthStatus();
    
    // Écouter les changements d'auth Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('hybridAuthUser');
      } else if (session?.user) {
        await checkAuthStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    loginWithCredentials,
    logout,
    checkAuthStatus
  };
};
