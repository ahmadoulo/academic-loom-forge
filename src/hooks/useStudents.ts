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
      // Validation : CIN requis
      if (!studentData.cin_number) {
        throw new Error('Le numéro CIN est requis');
      }

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

      if (error) throw error;

      // Créer un compte utilisateur si email fourni
      if (data.email && data.cin_number) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .insert([{
              user_id: crypto.randomUUID(),
              email: data.email,
              first_name: data.firstname,
              last_name: data.lastname,
              role: 'student',
              school_id: data.school_id,
              is_active: true
            }])
            .select()
            .single();

          if (profileData) {
            toast.success(`Étudiant et compte créés avec succès. Mot de passe: ${data.cin_number}`);
          }
        } catch (profileError) {
          console.warn('Erreur lors de la création du profil utilisateur:', profileError);
          toast.success('Étudiant créé avec succès (compte utilisateur non créé)');
        }
      } else {
        toast.success('Étudiant créé avec succès');
      }
      
      setStudents(prev => [...prev, data]);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de l\'étudiant';
      setError(message);
      toast.error(message);
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