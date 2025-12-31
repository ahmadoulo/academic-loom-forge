import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'global_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  school_id?: string;
  is_active: boolean;
}

export const useAuth = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for custom auth user in localStorage
    const storedUser = localStorage.getItem('customAuthUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setProfile({
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role as UserRole,
          school_id: userData.school_id,
          is_active: userData.is_active ?? true,
        });
      } catch (error) {
        localStorage.removeItem('customAuthUser');
      }
    }
    setLoading(false);
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem('customAuthUser');
      localStorage.removeItem('sessionToken');
      setProfile(null);
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      
      window.location.href = '/auth';
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur lors de la déconnexion",
        description: error.message,
      });
    }
  };

  return {
    user: profile ? { id: profile.id, email: profile.email } : null,
    session: null,
    profile,
    loading,
    signOut,
    isAuthenticated: !!profile,
    isGlobalAdmin: profile?.role === 'global_admin',
    isSchoolAdmin: profile?.role === 'school_admin',
    isTeacher: profile?.role === 'teacher',
    isStudent: profile?.role === 'student',
  };
};
