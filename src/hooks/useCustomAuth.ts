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
      
      const { data: userData, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        throw new Error('Identifiants incorrects');
      }

      const isValidPassword = await verifyPassword(password, userData.password_hash);
      if (!isValidPassword) {
        throw new Error('Identifiants incorrects');
      }

      // Mettre à jour la date de dernière connexion
      await supabase
        .from('user_credentials')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      const userProfile: UserCredential = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        school_id: userData.school_id,
        is_active: userData.is_active,
        last_login: userData.last_login,
      };

      setUser(userProfile);
      toast.success('Connexion réussie');
      
      // Stocker dans localStorage pour persistance
      localStorage.setItem('customAuthUser', JSON.stringify(userProfile));
      
      return userProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la connexion';
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
  };
};