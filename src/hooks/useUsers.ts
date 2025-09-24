import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRole } from './useAuth';

export interface User {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  school_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  school_id?: string;
  generated_password?: string;
}

export const useUsers = (schoolId?: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('*');

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      const generatedPassword = generatePassword();
      
      // Créer l'utilisateur avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: generatedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            school_id: userData.school_id
          }
        }
      });

      if (authError) throw authError;

      // Créer le profil utilisateur
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          user_id: authData.user?.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          school_id: userData.school_id,
          is_active: true
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      setUsers(prev => [profileData, ...prev]);
      toast.success(`Utilisateur créé avec succès. Mot de passe: ${generatedPassword}`);
      
      return { user: profileData, password: generatedPassword };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de l\'utilisateur';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const updateUserPassword = async (userId: string) => {
    try {
      const newPassword = generatePassword();
      
      // Mettre à jour le mot de passe via l'API admin de Supabase
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

      toast.success(`Mot de passe mis à jour: ${newPassword}`, {
        duration: 10000,
        action: {
          label: "Copier",
          onClick: () => navigator.clipboard.writeText(newPassword)
        }
      });
      
      return newPassword;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du mot de passe';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const updateUser = async (userId: string, updates: Partial<CreateUserData>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.user_id === userId ? { ...user, ...data } : user
      ));
      
      toast.success('Utilisateur mis à jour avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'utilisateur';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Supprimer d'abord le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Supprimer l'utilisateur de l'auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;

      setUsers(prev => prev.filter(user => user.user_id !== userId));
      toast.success('Utilisateur supprimé avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'utilisateur';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [schoolId]);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    refetch: fetchUsers
  };
};