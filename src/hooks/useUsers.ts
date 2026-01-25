import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserRole } from './useAuth';

export interface User {
  id: string;
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
        .from('app_users')
        // Explicit FK needed because app_user_roles has multiple relations to app_users
        .select('id, email, first_name, last_name, school_id, is_active, created_at, updated_at, app_user_roles!app_user_roles_user_id_fkey(role)');

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transformer les données pour correspondre au format User
      const transformedUsers: User[] = (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.app_user_roles?.[0]?.role || 'school_admin',
        school_id: user.school_id,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
      
      setUsers(transformedUsers);
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
      
      // Utiliser l'Edge Function pour créer le compte
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email: userData.email,
          password: generatedPassword,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.role,
          schoolId: userData.school_id
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await fetchUsers();
      
      // Copier le mot de passe dans le presse-papiers
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(generatedPassword);
        toast.success(`Utilisateur créé avec succès. Mot de passe copié: ${generatedPassword}`);
      } else {
        toast.success(`Utilisateur créé avec succès. Mot de passe: ${generatedPassword}`);
      }
      
      return { user: data.user, password: generatedPassword };
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
      
      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");
      
      if (!sessionToken) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return null;
      }
      
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { sessionToken, userId, newPassword }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      // Copier le mot de passe dans le presse-papiers
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(newPassword);
        toast.success(`Nouveau mot de passe généré et copié: ${newPassword}`, {
          duration: 10000
        });
      } else {
        toast.success(`Nouveau mot de passe généré: ${newPassword}`, {
          duration: 10000
        });
      }
      
      return newPassword;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la génération du mot de passe';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const updateUser = async (userId: string, updates: Partial<CreateUserData>) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .update({
          email: updates.email,
          first_name: updates.first_name,
          last_name: updates.last_name
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      await fetchUsers();
      
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
      // Supprimer les rôles d'abord
      const { error: rolesError } = await supabase
        .from('app_user_roles')
        .delete()
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      // Supprimer l'utilisateur
      const { error: userError } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId);

      if (userError) throw userError;

      setUsers(prev => prev.filter(user => user.id !== userId));
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
