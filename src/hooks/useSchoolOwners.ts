import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SchoolOwner {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  school_id: string;
  is_active: boolean;
}

export interface CreateOwnerData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  school_id: string;
}

export const useSchoolOwners = () => {
  const [loading, setLoading] = useState(false);

  const createOwner = async (ownerData: CreateOwnerData) => {
    try {
      setLoading(true);
      
      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");
      
      if (!sessionToken) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }
      
      // Utiliser l'Edge Function pour créer le compte
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          sessionToken,
          email: ownerData.email,
          password: ownerData.password,
          firstName: ownerData.first_name,
          lastName: ownerData.last_name,
          role: 'school_admin',
          schoolId: ownerData.school_id
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du propriétaire';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOwnerPassword = async (ownerId: string, newPassword: string) => {
    try {
      setLoading(true);
      
      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");
      
      if (!sessionToken) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { sessionToken, userId: ownerId, newPassword }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success('Mot de passe modifié avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la modification du mot de passe';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleOwnerStatus = async (ownerId: string, isActive: boolean) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('app_users')
        .update({ is_active: isActive })
        .eq('id', ownerId);

      if (error) throw error;
      
      toast.success(`Propriétaire ${isActive ? 'activé' : 'désactivé'} avec succès`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la modification du statut';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createOwner,
    updateOwnerPassword,
    toggleOwnerStatus,
  };
};
