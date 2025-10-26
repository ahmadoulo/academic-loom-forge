import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAcademicYear } from './useAcademicYear';

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
  const { getYearForDisplay, getYearForCreation, selectedYear, loading: yearLoading } = useAcademicYear();

  const fetchStudents = async () => {
    // Attendre que l'année soit chargée
    if (yearLoading) return;
    
    try {
      setLoading(true);
      const yearId = getYearForDisplay();
      
      // Utiliser student_school pour filtrer par année scolaire
      let query = supabase
        .from('student_school')
        .select(`
          student_id,
          school_id,
          class_id,
          is_active,
          students!inner (
            id,
            firstname,
            lastname,
            email,
            birth_date,
            cin_number,
            student_phone,
            parent_phone,
            created_at,
            updated_at
          ),
          classes!inner (
            name
          )
        `)
        .eq('is_active', true);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      
      if (classId) {
        query = query.eq('class_id', classId);
      }

      // Filtrer par année scolaire sélectionnée (null = toutes les années)
      if (yearId) {
        query = query.eq('school_year_id', yearId);
      }

      const { data, error } = await query.order('students(lastname)', { ascending: true });

      if (error) throw error;
      
      // Transformer les données pour correspondre à l'interface StudentWithClass
      const transformedData = (data || []).map((item: any) => ({
        id: item.students.id,
        firstname: item.students.firstname,
        lastname: item.students.lastname,
        email: item.students.email,
        class_id: item.class_id,
        school_id: item.school_id,
        birth_date: item.students.birth_date,
        cin_number: item.students.cin_number,
        student_phone: item.students.student_phone,
        parent_phone: item.students.parent_phone,
        created_at: item.students.created_at,
        updated_at: item.students.updated_at,
        classes: {
          name: item.classes.name
        }
      }));

      setStudents(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des étudiants');
      toast.error('Erreur lors du chargement des étudiants');
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (data: CreateStudentData) => {
    try {
      const currentYearId = getYearForCreation();
      
      // Validation : CIN requis
      if (!data.cin_number) {
        throw new Error('Le numéro CIN est requis');
      }

      // Validation : school_id requis
      if (!data.school_id) {
        throw new Error('L\'identifiant de l\'école est requis');
      }

      // Validation : class_id requis
      if (!data.class_id) {
        throw new Error('La classe est requise');
      }

      // Validation : prénom et nom requis
      if (!data.firstname?.trim()) {
        throw new Error('Le prénom est requis');
      }

      if (!data.lastname?.trim()) {
        throw new Error('Le nom est requis');
      }

      if (!currentYearId) {
        throw new Error('Aucune année scolaire active');
      }
      
      const insertData = {
        firstname: data.firstname.trim(),
        lastname: data.lastname.trim(),
        email: data.email?.trim() ? data.email.trim() : null,
        class_id: data.class_id,
        school_id: data.school_id,
        school_year_id: currentYearId,
        birth_date: data.birth_date?.trim() ? data.birth_date.trim() : null,
        cin_number: data.cin_number.trim(),
        student_phone: data.student_phone?.trim() ? data.student_phone.trim() : null,
        parent_phone: data.parent_phone?.trim() ? data.parent_phone.trim() : null,
      };
      
      // 1. Créer l'étudiant
      const { data: newStudent, error: studentError } = await supabase
        .from('students')
        .insert([insertData])
        .select('*')
        .single();

      if (studentError) throw studentError;
      if (!newStudent) throw new Error('Aucune donnée retournée après insertion');

      // 2. Créer l'entrée dans student_school
      const { error: enrollmentError } = await supabase
        .from('student_school')
        .insert([{
          student_id: newStudent.id,
          school_id: newStudent.school_id,
          school_year_id: currentYearId,
          class_id: newStudent.class_id,
          is_active: true
        }]);

      if (enrollmentError) throw enrollmentError;

      // 3. Récupérer les données complètes avec la classe
      const { data: completeData, error: fetchError } = await supabase
        .from('students')
        .select(`
          *,
          classes (
            name
          )
        `)
        .eq('id', newStudent.id)
        .single();

      if (fetchError) throw fetchError;

      toast.success('Étudiant créé avec succès');
      setStudents(prev => [...prev, completeData]);
      
      return completeData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de l\'étudiant';
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const importStudents = async (studentsData: CreateStudentData[]) => {
    try {
      const currentYearId = getYearForCreation();

      if (!currentYearId) {
        throw new Error('Aucune année scolaire active');
      }

      // Ajouter school_year_id à chaque étudiant
      const dataWithYear = studentsData.map(student => ({
        ...student,
        school_year_id: currentYearId
      }));

      const { data, error } = await supabase
        .from('students')
        .insert(dataWithYear)
        .select(`
          *,
          classes (
            name
          )
        `);

      if (error) throw error;

      // Créer les entrées dans student_school
      if (data) {
        const enrollments = data.map(student => ({
          student_id: student.id,
          school_id: student.school_id,
          school_year_id: currentYearId,
          class_id: student.class_id,
          is_active: true
        }));

        const { error: enrollmentError } = await supabase
          .from('student_school')
          .insert(enrollments);

        if (enrollmentError) throw enrollmentError;
      }
      
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

      // 1. Mettre à jour l'étudiant
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

      // 2. Si la classe a changé, mettre à jour student_school aussi
      if (studentData.class_id !== undefined) {
        const yearId = getYearForDisplay();
        if (yearId) {
          await supabase
            .from('student_school')
            .update({ class_id: studentData.class_id })
            .eq('student_id', id)
            .eq('school_year_id', yearId)
            .eq('is_active', true);
        }
      }
      
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
    if (!yearLoading) {
      fetchStudents();
    }
  }, [schoolId, classId, selectedYear?.id, yearLoading]);

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