import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CurrentStudentData {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  class_id: string;
  school_id: string;
  birth_date?: string;
  cin_number?: string;
  student_phone?: string;
  parent_phone?: string;
  classes: {
    name: string;
  };
  schools: {
    name: string;
  };
}

export const useCurrentStudent = () => {
  const [student, setStudent] = useState<CurrentStudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchCurrentStudent = async () => {
    if (!user || !profile || profile.role !== 'student') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Find student by email matching the authenticated user's email
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes (
            name
          ),
          schools (
            name
          )
        `)
        .eq('email', user.email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      setStudent(data);
    } catch (err) {
      console.error('Erreur lors du chargement des données étudiant:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données étudiant');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentStudent();
  }, [user, profile]);

  return {
    student,
    loading,
    error,
    refetch: fetchCurrentStudent
  };
};