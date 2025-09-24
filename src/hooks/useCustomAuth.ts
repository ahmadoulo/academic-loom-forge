import { useState } from 'react';
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
      
      console.log('DEBUG: Tentative de connexion avec email:', email);
      
      const { data: userData, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      console.log('DEBUG: Données utilisateur trouvées:', userData);
      console.log('DEBUG: Erreur requête:', error);

      if (error || !userData) {
        console.log('DEBUG: Utilisateur non trouvé ou erreur');
        throw new Error('Identifiants incorrects');
      }

      console.log('DEBUG: Hash en base:', userData.password_hash);
      
      const computedHash = await hashPassword(password);
      console.log('DEBUG: Hash calculé:', computedHash);
      
      const isValidPassword = computedHash === userData.password_hash;
      console.log('DEBUG: Mot de passe valide:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('DEBUG: Mot de passe incorrect');
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
        teacher_id: teacherId, // Ajouter l'ID du professeur
      };

      setUser(userProfile);
      toast.success('Connexion réussie');
      
      // Stocker dans localStorage pour persistance
      localStorage.setItem('customAuthUser', JSON.stringify(userProfile));
      
      return userProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la connexion';
      console.error('DEBUG: Erreur de connexion:', message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('customAuthUser');
    toast.success('Déconnexion réussie');
    // Rediriger vers la page d'authentification
    window.location.href = '/auth';
  };

  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem('customAuthUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  return {
    user,
    loading,
    createUserCredential,
    loginWithCredentials,
    logout,
    checkAuthStatus,
    hashPassword, // Expose hashPassword function
  };
};