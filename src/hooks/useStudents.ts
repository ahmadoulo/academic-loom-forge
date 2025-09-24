import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Student {
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
  created_at: string;
  updated_at: string;
}

export interface StudentWithClass extends Student {
  classes: {
    name: string;
  };
}

export interface CreateStudentData {
  firstname: string;
  lastname: string;
  email?: string;
  class_id: string;
  school_id: string;
  birth_date?: string;
  cin_number?: string;
  student_phone?: string;
  parent_phone?: string;
}

export const useStudents = (schoolId?: string, classId?: string) => {
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('students')
        .select(`
          *,
          classes (
            name
          )
        `);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      
      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query.order('lastname', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des étudiants');
      toast.error('Erreur lors du chargement des étudiants');
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (studentData: CreateStudentData) => {
    try {
      console.log('=== useStudents createStudent DÉBUT ===');
      console.log('Données reçues:', studentData);
      
      // Validation : CIN requis
      if (!studentData.cin_number) {
        console.error('Erreur: CIN manquant');
        throw new Error('Le numéro CIN est requis');
      }

      // Validation : school_id requis
      if (!studentData.school_id) {
        console.error('Erreur: school_id manquant');
        throw new Error('L\'identifiant de l\'école est requis');
      }

      // Validation : class_id requis
      if (!studentData.class_id) {
        console.error('Erreur: class_id manquant');
        throw new Error('La classe est requise');
      }

      console.log('Validations passées, insertion dans Supabase...');
      
      const { data, error } = await supabase
        .from('students')
        .insert([studentData])
        .select(`
          *,
          classes (
            name
          )
        `)
        .single();

      console.log('Résultat Supabase:', { data, error });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      if (!data) {
        console.error('Aucune donnée retournée de Supabase');
        throw new Error('Aucune donnée retournée après insertion');
      }

      console.log('Étudiant créé avec succès:', data);
      toast.success('Étudiant créé avec succès');
      
      setStudents(prev => {
        console.log('Mise à jour de la liste des étudiants');
        return [...prev, data];
      });
      
      console.log('=== useStudents createStudent FIN ===');
      return data;
    } catch (err) {
      console.error('=== ERREUR dans createStudent ===');
      console.error('Type d\'erreur:', typeof err);
      console.error('Message d\'erreur:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de l\'étudiant';
      setError(message);
      toast.error(message);
      console.log('=== FIN GESTION ERREUR ===');
      throw err;
    }
  };

  const importStudents = async (studentsData: CreateStudentData[]) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert(studentsData)
        .select(`
          *,
          classes (
            name
          )
        `);

      if (error) throw error;
      
      setStudents(prev => [...prev, ...(data || [])]);
      toast.success(`${data?.length || 0} étudiants importés avec succès`);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'import des étudiants';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setStudents(prev => prev.filter(student => student.id !== id));
      toast.success('Étudiant supprimé avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'étudiant';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [schoolId, classId]);

  return {
    students,
    loading,
    error,
    createStudent,
    importStudents,
    deleteStudent,
    refetch: fetchStudents
  };
};