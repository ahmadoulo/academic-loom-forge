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
  teacher_id?: string; // Ajouter l'ID du professeur
}

export const useCustomAuth = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserCredential | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Hachage simple côté client (pour démo - en prod utiliser un service backend)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt123'); // Ajout d'un salt simple
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    const computedHash = await hashPassword(password);
    return computedHash === hash;
  };

  const createUserCredential = async (userData: CreateUserCredentials) => {
    try {
      setLoading(true);
      
      const passwordHash = await hashPassword(userData.password);
      
      const { data, error } = await supabase
        .from('user_credentials')
        .insert([{
          email: userData.email,
          password_hash: passwordHash,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          school_id: userData.school_id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Si c'est un professeur, créer aussi un enregistrement dans la table teachers
      if (userData.role === 'teacher' && userData.school_id) {
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert([{
            firstname: userData.first_name,
            lastname: userData.last_name,
            email: userData.email,
            school_id: userData.school_id,
          }]);

        if (teacherError) {
          console.error('Erreur lors de la création du professeur:', teacherError);
          // Ne pas faire échouer la création de l'utilisateur pour cette erreur
        }
      }
      
      toast.success('Utilisateur créé avec succès');
      return data;
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
      
      // Essayer d'abord avec student_accounts
      const { data: studentAccount, error: studentError } = await supabase
        .from('student_accounts')
        .select('*, student:students(*, classes(*))')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (!studentError && studentAccount && studentAccount.password_hash) {
        // Vérifier le mot de passe avec bcrypt
        const bcrypt = await import('bcryptjs');
        const passwordMatch = await bcrypt.compare(password, studentAccount.password_hash);
        
        if (passwordMatch) {
          const studentUser: UserCredential = {
            id: studentAccount.id,
            email: studentAccount.email,
            first_name: studentAccount.student?.firstname || '',
            last_name: studentAccount.student?.lastname || '',
            role: 'student',
            school_id: studentAccount.school_id,
            is_active: true,
          };
          
          setUser(studentUser);
          localStorage.setItem('customAuthUser', JSON.stringify(studentUser));
          toast.success('Connexion réussie');
          
          setTimeout(() => {
            window.location.href = `/student/${studentAccount.student_id}`;
          }, 100);
          
          return studentUser;
        }
      }
      
      // Si pas trouvé dans student_accounts, essayer user_credentials
      const { data: userData, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        throw new Error('Identifiants incorrects');
      }
      
      const computedHash = await hashPassword(password);
      const isValidPassword = computedHash === userData.password_hash;
      
      if (!isValidPassword) {
        throw new Error('Identifiants incorrects');
      }

      // Mettre à jour la date de dernière connexion
      await supabase
        .from('user_credentials')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      // Si c'est un professeur, récupérer son ID depuis la table teachers
      let teacherId = null;
      if (userData.role === 'teacher') {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', userData.email)
          .eq('school_id', userData.school_id)
          .single();
        
        teacherId = teacherData?.id;
      }

      const userProfile: UserCredential = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        school_id: userData.school_id,
        is_active: userData.is_active,
        last_login: userData.last_login,
        teacher_id: teacherId,
      };
      
      setUser(userProfile);
      localStorage.setItem('customAuthUser', JSON.stringify(userProfile));
      
      toast.success('Connexion réussie');
      
      // Redirection immédiate
      setTimeout(() => {
        if (userProfile.role === 'global_admin' || userProfile.role === 'admin') {
          window.location.href = '/admin';
        } else if (userProfile.role === 'school_admin' && userProfile.school_id) {
          window.location.href = `/school/${userProfile.school_id}`;
        } else if (userProfile.role === 'teacher' && userProfile.teacher_id) {
          window.location.href = `/teacher/${userProfile.teacher_id}`;
        } else {
          window.location.href = '/dashboard';
        }
      }, 100);
      
      return userProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la connexion';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    // Nettoyer complètement le localStorage
    localStorage.removeItem('customAuthUser');
    localStorage.clear(); // Nettoyer toutes les sessions en cache
    
    toast.success('Déconnexion réussie');
    
    // Forcer le rechargement complet pour vider le cache React
    window.location.replace('/auth');
  }, []);

  const checkAuthStatus = useCallback(() => {
    if (initialized) return; // Éviter les appels multiples
    
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

  // Initialiser l'état une seule fois au montage du hook
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
    hashPassword,
  };
};