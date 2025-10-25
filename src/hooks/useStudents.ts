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
      console.log('supabase client disponible:', !!supabase);
      
      // Validation : CIN requis
      if (!studentData.cin_number) {
        console.error('❌ Validation échouée: CIN manquant');
        throw new Error('Le numéro CIN est requis');
      }

      // Validation : school_id requis
      if (!studentData.school_id) {
        console.error('❌ Validation échouée: school_id manquant');
        throw new Error('L\'identifiant de l\'école est requis');
      }

      // Validation : class_id requis
      if (!studentData.class_id) {
        console.error('❌ Validation échouée: class_id manquant');
        throw new Error('La classe est requise');
      }

      // Validation : prénom et nom requis
      if (!studentData.firstname?.trim()) {
        console.error('❌ Validation échouée: Prénom manquant');
        throw new Error('Le prénom est requis');
      }

      if (!studentData.lastname?.trim()) {
        console.error('❌ Validation échouée: Nom manquant');
        throw new Error('Le nom est requis');
      }

      console.log('✅ Toutes les validations passées');
      console.log('📤 Insertion dans Supabase...');
      
      const insertData = {
        firstname: studentData.firstname.trim(),
        lastname: studentData.lastname.trim(),
        email: studentData.email?.trim() ? studentData.email.trim() : null,
        class_id: studentData.class_id,
        school_id: studentData.school_id,
        birth_date: studentData.birth_date?.trim() ? studentData.birth_date.trim() : null,
        cin_number: studentData.cin_number.trim(),
        student_phone: studentData.student_phone?.trim() ? studentData.student_phone.trim() : null,
        parent_phone: studentData.parent_phone?.trim() ? studentData.parent_phone.trim() : null,
      };
      
      console.log('Données à insérer:', insertData);
      
      const { data, error } = await supabase
        .from('students')
        .insert([insertData])
        .select(`
          *,
          classes (
            name
          )
        `)
        .single();

      console.log('📥 Résultat Supabase:');
      console.log('  - data:', data);
      console.log('  - error:', error);

      if (error) {
        console.error('❌ Erreur Supabase détaillée:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      if (!data) {
        console.error('❌ Aucune donnée retournée de Supabase');
        throw new Error('Aucune donnée retournée après insertion');
      }

      console.log('✅ Étudiant créé avec succès dans la base:', data);
      toast.success('Étudiant créé avec succès');
      
      console.log('📝 Mise à jour de la liste locale des étudiants...');
      setStudents(prev => {
        const newList = [...prev, data];
        console.log('  - Ancienne liste:', prev.length, 'étudiants');
        console.log('  - Nouvelle liste:', newList.length, 'étudiants');
        return newList;
      });
      
      console.log('=== useStudents createStudent FIN SUCCESS ===');
      return data;
    } catch (err) {
      console.error('=== ❌ ERREUR dans createStudent ===');
      console.error('Type d\'erreur:', typeof err);
      console.error('Erreur complète:', err);
      
      if (err && typeof err === 'object') {
        console.error('Propriétés de l\'erreur:');
        Object.keys(err).forEach(key => {
          console.error(`  ${key}:`, (err as any)[key]);
        });
      }
      
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de l\'étudiant';
      console.error('Message d\'erreur final:', message);
      
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

  const updateStudent = async (id: string, studentData: Partial<CreateStudentData>) => {
    try {
      const updateData: any = {};
      
      if (studentData.firstname !== undefined) updateData.firstname = studentData.firstname.trim();
      if (studentData.lastname !== undefined) updateData.lastname = studentData.lastname.trim();
      if (studentData.email !== undefined) updateData.email = studentData.email?.trim() || null;
      if (studentData.class_id !== undefined) updateData.class_id = studentData.class_id;
      if (studentData.birth_date !== undefined) updateData.birth_date = studentData.birth_date?.trim() || null;
      if (studentData.cin_number !== undefined) updateData.cin_number = studentData.cin_number?.trim() || null;
      if (studentData.student_phone !== undefined) updateData.student_phone = studentData.student_phone?.trim() || null;
      if (studentData.parent_phone !== undefined) updateData.parent_phone = studentData.parent_phone?.trim() || null;

      const { data, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          classes (
            name
          )
        `)
        .single();

      if (error) throw error;
      
      setStudents(prev => prev.map(student => student.id === id ? data : student));
      toast.success('Étudiant modifié avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la modification de l\'étudiant';
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
    updateStudent,
    importStudents,
    deleteStudent,
    refetch: fetchStudents
  };
};