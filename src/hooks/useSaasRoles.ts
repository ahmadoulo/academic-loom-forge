import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SaasRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSaasRoleData {
  name: string;
  description?: string;
  permissions: string[];
}

export const useSaasRoles = () => {
  const [roles, setRoles] = useState<SaasRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saas_roles')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      setRoles((data || []).map(role => ({
        ...role,
        permissions: (Array.isArray(role.permissions) ? role.permissions : []).filter((p): p is string => typeof p === 'string')
      })));
    } catch (err) {
      console.error('Error fetching SaaS roles:', err);
      toast.error('Erreur lors du chargement des rôles');
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (roleData: CreateSaasRoleData) => {
    try {
      const { data, error } = await supabase
        .from('saas_roles')
        .insert([{
          name: roleData.name,
          description: roleData.description || null,
          permissions: roleData.permissions,
          is_system: false
        }])
        .select()
        .single();

      if (error) throw error;

      const roleWithPermissions = {
        ...data,
        permissions: (Array.isArray(data.permissions) ? data.permissions : []).filter((p): p is string => typeof p === 'string')
      };
      setRoles(prev => [...prev, roleWithPermissions]);
      toast.success('Rôle créé avec succès');
      return data;
    } catch (err: any) {
      console.error('Error creating SaaS role:', err);
      toast.error(err.message || 'Erreur lors de la création du rôle');
      throw err;
    }
  };

  const updateRole = async (roleId: string, updates: Partial<CreateSaasRoleData>) => {
    try {
      const { data, error } = await supabase
        .from('saas_roles')
        .update(updates)
        .eq('id', roleId)
        .select()
        .single();

      if (error) throw error;

      const roleWithPermissions = {
        ...data,
        permissions: (Array.isArray(data.permissions) ? data.permissions : []).filter((p): p is string => typeof p === 'string')
      };
      setRoles(prev => prev.map(role => role.id === roleId ? roleWithPermissions : role));
      toast.success('Rôle mis à jour avec succès');
      return data;
    } catch (err: any) {
      console.error('Error updating SaaS role:', err);
      toast.error(err.message || 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('saas_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      setRoles(prev => prev.filter(role => role.id !== roleId));
      toast.success('Rôle supprimé avec succès');
    } catch (err: any) {
      console.error('Error deleting SaaS role:', err);
      toast.error(err.message || 'Erreur lors de la suppression');
      throw err;
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return {
    roles,
    loading,
    createRole,
    updateRole,
    deleteRole,
    refetch: fetchRoles
  };
};