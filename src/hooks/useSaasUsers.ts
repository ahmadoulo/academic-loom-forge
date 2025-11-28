import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SaasUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  role?: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface CreateSaasUserData {
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
  password: string;
}

// Hash password function (same as useCustomAuth)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useSaasUsers = () => {
  const [users, setUsers] = useState<SaasUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saas_users')
        .select(`
          *,
          role:saas_roles(id, name, description)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching SaaS users:', err);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateSaasUserData) => {
    try {
      const passwordHash = await hashPassword(userData.password);
      
      const { data, error } = await supabase
        .from('saas_users')
        .insert([{
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role_id: userData.role_id,
          password_hash: passwordHash,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => [data, ...prev]);
      toast.success('Utilisateur créé avec succès');
      return data;
    } catch (err: any) {
      console.error('Error creating SaaS user:', err);
      toast.error(err.message || 'Erreur lors de la création de l\'utilisateur');
      throw err;
    }
  };

  const updateUser = async (userId: string, updates: Partial<CreateSaasUserData>) => {
    try {
      const updateData: any = { ...updates };
      if (updates.password) {
        updateData.password_hash = await hashPassword(updates.password);
        delete updateData.password;
      }

      const { data, error } = await supabase
        .from('saas_users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => prev.map(user => user.id === userId ? { ...user, ...data } : user));
      toast.success('Utilisateur mis à jour avec succès');
      return data;
    } catch (err: any) {
      console.error('Error updating SaaS user:', err);
      toast.error(err.message || 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('saas_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('Utilisateur supprimé avec succès');
    } catch (err: any) {
      console.error('Error deleting SaaS user:', err);
      toast.error(err.message || 'Erreur lors de la suppression');
      throw err;
    }
  };

  const resetPassword = async (userId: string, newPassword: string) => {
    try {
      const passwordHash = await hashPassword(newPassword);
      
      const { error } = await supabase
        .from('saas_users')
        .update({ password_hash: passwordHash })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Mot de passe réinitialisé avec succès');
    } catch (err: any) {
      console.error('Error resetting password:', err);
      toast.error(err.message || 'Erreur lors de la réinitialisation');
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    refetch: fetchUsers
  };
};