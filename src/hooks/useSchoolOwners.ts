import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';

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
      
      // Hash password with bcrypt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(ownerData.password, salt);
      
      const { data, error } = await supabase
        .from('user_credentials')
        .insert([{
          email: ownerData.email,
          password_hash: passwordHash,
          first_name: ownerData.first_name,
          last_name: ownerData.last_name,
          role: 'school_admin',
          school_id: ownerData.school_id,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;
      
      return data;
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
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      
      const { error } = await supabase
        .from('user_credentials')
        .update({ password_hash: passwordHash })
        .eq('id', ownerId);

      if (error) throw error;
      
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
        .from('user_credentials')
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