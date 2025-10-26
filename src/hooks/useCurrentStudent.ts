import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAcademicYear } from './useAcademicYear';

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
  const { getYearForDisplay, currentYear } = useAcademicYear();

  const fetchCurrentStudent = async () => {
    // Allow fetching when studentId is provided, even without auth
    if (!studentId && (!user || !profile)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const yearId = getYearForDisplay();
      
      // If studentId is provided, fetch specific student by ID
      if (studentId) {
        // Utiliser student_school pour respecter le filtre par année
        let query = supabase
          .from('student_school')
          .select(`
            student_id,
            school_id,
            class_id,
            students!inner (
              id,
              firstname,
              lastname,
              email,
              birth_date,
              cin_number,
              student_phone,
              parent_phone
            ),
            classes!inner (
              name
            ), 
            schools!inner (
              name
            )
          `)
          .eq('student_id', studentId)
          .eq('is_active', true);

        // Filtrer par année si sélectionnée
        if (yearId) {
          query = query.eq('school_year_id', yearId);
        }

        const { data: enrollmentData, error: enrollmentError } = await query.maybeSingle();
          
        if (enrollmentData && !enrollmentError) {
          const transformedData: CurrentStudentData = {
            id: enrollmentData.students.id,
            firstname: enrollmentData.students.firstname,
            lastname: enrollmentData.students.lastname,
            email: enrollmentData.students.email,
            class_id: enrollmentData.class_id,
            school_id: enrollmentData.school_id,
            birth_date: enrollmentData.students.birth_date,
            cin_number: enrollmentData.students.cin_number,
            student_phone: enrollmentData.students.student_phone,
            parent_phone: enrollmentData.students.parent_phone,
            classes: {
              name: enrollmentData.classes.name
            },
            schools: {
              name: enrollmentData.schools.name
            }
          };
          setStudent(transformedData);
          return;
        }
        if (enrollmentError && enrollmentError.code !== 'PGRST116') {
          throw enrollmentError;
        }
        
        // If not found by ID, set no student
        setStudent(null);
        return;
      }
      
      // Original logic for authenticated user (when no studentId provided)
      if (user?.email) {
        // Chercher l'étudiant par email via student_school
        let query = supabase
          .from('student_school')
          .select(`
            student_id,
            school_id,
            class_id,
            students!inner (
              id,
              firstname,
              lastname,
              email,
              birth_date,
              cin_number,
              student_phone,
              parent_phone
            ),
            classes!inner (
              name
            ), 
            schools!inner (
              name
            )
          `)
          .eq('students.email', user.email)
          .eq('is_active', true);

        if (yearId) {
          query = query.eq('school_year_id', yearId);
        }

        const { data: enrollmentData, error } = await query.maybeSingle();

        // If not found in students table, try to create a mock student from profile data
        if (!enrollmentData && profile) {
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
        } else if (enrollmentData) {
          const transformedData: CurrentStudentData = {
            id: enrollmentData.students.id,
            firstname: enrollmentData.students.firstname,
            lastname: enrollmentData.students.lastname,
            email: enrollmentData.students.email,
            class_id: enrollmentData.class_id,
            school_id: enrollmentData.school_id,
            birth_date: enrollmentData.students.birth_date,
            cin_number: enrollmentData.students.cin_number,
            student_phone: enrollmentData.students.student_phone,
            parent_phone: enrollmentData.students.parent_phone,
            classes: {
              name: enrollmentData.classes.name
            },
            schools: {
              name: enrollmentData.schools.name
            }
          };
          setStudent(transformedData);
        } else {
          setStudent(null);
        }

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          throw error;
        }
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
  }, [user, profile, studentId, currentYear?.id]);

  return {
    student,
    loading,
    error,
    refetch: fetchCurrentStudent
  };
};