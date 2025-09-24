import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch real profile from database
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              if (error) {
                // If no profile found, create mock profile from user metadata
                const mockProfile: UserProfile = {
                  id: session.user.id,
                  email: session.user.email || '',
                  first_name: session.user.user_metadata?.first_name || 'Utilisateur',
                  last_name: session.user.user_metadata?.last_name || '',
                  role: session.user.user_metadata?.role || 'student',
                  school_id: session.user.user_metadata?.school_id,
                  is_active: true,
                };
                setProfile(mockProfile);
              } else {
                setProfile(profileData);
              }
            } catch (err) {
              console.error('Error fetching profile:', err);
              // Fallback to mock profile
              const mockProfile: UserProfile = {
                id: session.user.id,
                email: session.user.email || '',
                first_name: session.user.user_metadata?.first_name || 'Utilisateur',
                last_name: session.user.user_metadata?.last_name || '',
                role: session.user.user_metadata?.role || 'student',
                school_id: session.user.user_metadata?.school_id,
                is_active: true,
              };
              setProfile(mockProfile);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: {
    first_name: string;
    last_name: string;
    role: UserRole;
    school_id?: string;
  }) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            school_id: userData.school_id
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Compte créé avec succès",
        description: "Vous pouvez maintenant vous connecter.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur lors de la création du compte",
        description: error.message,
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur EduVate !",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error.message,
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setProfile(null);
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur lors de la déconnexion",
        description: error.message,
      });
    }
  };

  // Fonction pour rediriger selon le rôle
  const redirectByRole = (role: UserRole) => {
    switch (role) {
      case 'global_admin':
        window.location.href = '/admin';
        break;
      case 'school_admin':
        window.location.href = '/school';
        break;
      case 'teacher':
        window.location.href = '/teacher';
        break;
      case 'student':
        window.location.href = '/student';
        break;
      case 'parent':
        window.location.href = '/parent';
        break;
      default:
        window.location.href = '/';
    }
  };

  // Redirection automatique après connexion
  useEffect(() => {
    if (profile && !loading) {
      redirectByRole(profile.role);
    }
  }, [profile, loading]);

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    redirectByRole,
    isAuthenticated: !!user,
    isGlobalAdmin: profile?.role === 'global_admin',
    isSchoolAdmin: profile?.role === 'school_admin',
    isTeacher: profile?.role === 'teacher',
    isStudent: profile?.role === 'student',
    isParent: profile?.role === 'parent',
  };
};