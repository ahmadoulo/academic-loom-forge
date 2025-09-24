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
      
      // Créer directement le profil utilisateur avec un user_id temporaire
      const tempUserId = crypto.randomUUID();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          user_id: tempUserId,
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
      
      // Copier le mot de passe dans le presse-papiers
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(generatedPassword);
        toast.success(`Utilisateur créé avec succès. Mot de passe copié: ${generatedPassword}`);
      } else {
        toast.success(`Utilisateur créé avec succès. Mot de passe: ${generatedPassword}`);
      }
      
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
      // Supprimer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

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