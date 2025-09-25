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

export const useCurrentStudent = (studentId?: string) => {
  const [student, setStudent] = useState<CurrentStudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchCurrentStudent = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // If studentId is provided, fetch specific student
      if (studentId) {
        const { data: studentData, error: studentError } = await supabase
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
          .eq('id', studentId)
          .maybeSingle();
          
        if (studentData && !studentError) {
          setStudent(studentData);
          return;
        }
        if (studentError) {
          throw studentError;
        }
      }
      
      // First try to find student by email in students table
      let { data, error } = await supabase
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
        .maybeSingle();

      // If not found in students table, try to create a mock student from profile data
      if (!data && profile) {
        // For now, create a mock student data based on profile
        const mockStudentData: CurrentStudentData = {
          id: profile.id,
          firstname: profile.first_name || 'Étudiant',
          lastname: profile.last_name || '',
          email: profile.email,
          class_id: 'mock-class-id',
          school_id: profile.school_id || 'mock-school-id',
          classes: {
            name: 'Classe Non Assignée'
          },
          schools: {
            name: 'École Non Assignée'
          }
        };
        setStudent(mockStudentData);
      } else {
        setStudent(data);
      }

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

    } catch (err) {
      console.error('Erreur lors du chargement des données étudiant:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données étudiant');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentStudent();
  }, [user, profile, studentId]);

  return {
    student,
    loading,
    error,
    refetch: fetchCurrentStudent
  };
};