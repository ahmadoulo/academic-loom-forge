import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Admission {
  id: string;
  school_id: string;
  civility: 'M' | 'Mme' | 'Mlle';
  firstname: string;
  lastname: string;
  nationality: string;
  city: string;
  phone: string;
  email: string;
  desired_cycle_id: string;
  desired_option_id?: string;
  education_level: string;
  last_institution: string;
  last_institution_type: 'public' | 'private' | 'mission';
  status: 'nouveau' | 'en_cours' | 'traite';
  notes?: string;
  converted_to_student_id?: string;
  converted_at?: string;
  created_at: string;
  updated_at: string;
  cycles?: {
    name: string;
  };
  options?: {
    name: string;
  };
}

export interface CreateAdmissionData {
  school_id: string;
  civility: 'M' | 'Mme' | 'Mlle';
  firstname: string;
  lastname: string;
  nationality: string;
  city: string;
  phone: string;
  email: string;
  desired_cycle_id: string;
  desired_option_id?: string;
  education_level: string;
  last_institution: string;
  last_institution_type: 'public' | 'private' | 'mission';
}

export const useAdmissions = (schoolId?: string) => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmissions = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('school_admission')
        .select(`
          *,
          cycles(name),
          options(name)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAdmissions((data || []) as Admission[]);
    } catch (err: any) {
      console.error('Error fetching admissions:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des demandes d\'admission');
    } finally {
      setLoading(false);
    }
  };

  const createAdmission = async (data: CreateAdmissionData) => {
    try {
      const { error: insertError } = await supabase
        .from('school_admission')
        .insert([data]);

      if (insertError) throw insertError;

      toast.success('Demande d\'admission envoyée avec succès');
      await fetchAdmissions();
      return true;
    } catch (err: any) {
      console.error('Error creating admission:', err);
      toast.error('Erreur lors de l\'envoi de la demande');
      return false;
    }
  };

  const updateAdmissionStatus = async (admissionId: string, status: 'nouveau' | 'en_cours' | 'traite', notes?: string) => {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { error: updateError } = await supabase
        .from('school_admission')
        .update(updateData)
        .eq('id', admissionId);

      if (updateError) throw updateError;

      toast.success('Statut mis à jour');
      await fetchAdmissions();
      return true;
    } catch (err: any) {
      console.error('Error updating admission status:', err);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    }
  };

  const deleteAdmission = async (admissionId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('school_admission')
        .delete()
        .eq('id', admissionId);

      if (deleteError) throw deleteError;

      toast.success('Demande supprimée');
      await fetchAdmissions();
      return true;
    } catch (err: any) {
      console.error('Error deleting admission:', err);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [schoolId]);

  return {
    admissions,
    loading,
    error,
    fetchAdmissions,
    createAdmission,
    updateAdmissionStatus,
    deleteAdmission
  };
};
