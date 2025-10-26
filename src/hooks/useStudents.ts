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
  cin_number: string; // Requis maintenant
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
      
      // Validations de base
      if (!data.firstname?.trim()) throw new Error('Le prénom est requis');
      if (!data.lastname?.trim()) throw new Error('Le nom est requis');
      if (!data.cin_number?.trim()) throw new Error('Le numéro CIN/Passport est requis');
      if (!data.school_id) throw new Error('L\'identifiant de l\'école est requis');
      if (!data.class_id) throw new Error('La classe est requise');
      if (!currentYearId) throw new Error('Aucune année scolaire active');

      // 1. Vérifier si un étudiant avec ce CIN existe déjà
      const { data: existingStudent, error: searchError } = await supabase
        .from('students')
        .select('id, firstname, lastname')
        .eq('cin_number', data.cin_number.trim())
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') throw searchError;

      let studentId: string;

      if (existingStudent) {
        // L'étudiant existe déjà, vérifier s'il est déjà inscrit cette année
        const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
          .from('student_school')
          .select('id, school_id, schools!inner(name)')
          .eq('student_id', existingStudent.id)
          .eq('school_year_id', currentYearId)
          .eq('is_active', true)
          .maybeSingle();

        if (enrollmentCheckError && enrollmentCheckError.code !== 'PGRST116') throw enrollmentCheckError;

        if (existingEnrollment) {
          // Déjà inscrit cette année
          if (existingEnrollment.school_id !== data.school_id) {
            // Inscrit dans une autre école cette année: bloquer
            const schoolName = (existingEnrollment as any).schools?.name || 'une autre école';
            throw new Error(
              `Cet étudiant (${existingStudent.firstname} ${existingStudent.lastname}) est déjà inscrit dans ${schoolName} pour l'année scolaire en cours. ` +
              `Veuillez procéder à un transfert d'école si nécessaire.`
            );
          } else {
            // Déjà inscrit dans la même école cette année
            throw new Error(
              `Cet étudiant (${existingStudent.firstname} ${existingStudent.lastname}) est déjà inscrit dans cette école pour l'année scolaire en cours.`
            );
          }
        }

        // Pas d'inscription cette année, réutiliser le même ID
        studentId = existingStudent.id;
        toast.info(`Étudiant existant trouvé: ${existingStudent.firstname} ${existingStudent.lastname}. Création de l'inscription pour la nouvelle année.`);
        
        // Mettre à jour les infos de l'étudiant si nécessaire
        await supabase
          .from('students')
          .update({
            firstname: data.firstname.trim(),
            lastname: data.lastname.trim(),
            email: data.email?.trim() || null,
            birth_date: data.birth_date?.trim() || null,
            student_phone: data.student_phone?.trim() || null,
            parent_phone: data.parent_phone?.trim() || null,
          })
          .eq('id', studentId);
      } else {
        // Nouvel étudiant, créer l'entrée
        const { data: newStudent, error: studentError } = await supabase
          .from('students')
          .insert([{
            firstname: data.firstname.trim(),
            lastname: data.lastname.trim(),
            email: data.email?.trim() || null,
            cin_number: data.cin_number.trim(),
            birth_date: data.birth_date?.trim() || null,
            student_phone: data.student_phone?.trim() || null,
            parent_phone: data.parent_phone?.trim() || null,
          }])
          .select('id')
          .single();

        if (studentError) throw studentError;
        if (!newStudent) throw new Error('Aucune donnée retournée après insertion');
        
        studentId = newStudent.id;
      }

      // 2. Créer l'inscription dans student_school
      const { error: enrollmentError } = await supabase
        .from('student_school')
        .insert([{
          student_id: studentId,
          school_id: data.school_id,
          school_year_id: currentYearId,
          class_id: data.class_id,
          is_active: true
        }]);

      if (enrollmentError) throw enrollmentError;

      // 3. Récupérer les données complètes via student_school
      const { data: completeData, error: fetchError } = await supabase
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
            parent_phone,
            created_at,
            updated_at
          ),
          classes!inner (
            name
          )
        `)
        .eq('student_id', studentId)
        .eq('school_year_id', currentYearId)
        .eq('school_id', data.school_id)
        .eq('is_active', true)
        .single();

      if (fetchError) throw fetchError;

      // Transformer au format StudentWithClass
      const transformedData = {
        id: (completeData as any).students.id,
        firstname: (completeData as any).students.firstname,
        lastname: (completeData as any).students.lastname,
        email: (completeData as any).students.email,
        class_id: completeData.class_id,
        school_id: completeData.school_id,
        birth_date: (completeData as any).students.birth_date,
        cin_number: (completeData as any).students.cin_number,
        student_phone: (completeData as any).students.student_phone,
        parent_phone: (completeData as any).students.parent_phone,
        created_at: (completeData as any).students.created_at,
        updated_at: (completeData as any).students.updated_at,
        classes: {
          name: (completeData as any).classes.name
        }
      };

      toast.success('Étudiant créé avec succès');
      setStudents(prev => [...prev, transformedData]);
      
      return transformedData;
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

      // Valider que tous les étudiants ont un CIN
      const missingCin = studentsData.filter(s => !s.cin_number?.trim());
      if (missingCin.length > 0) {
        throw new Error(`${missingCin.length} étudiant(s) n'ont pas de numéro CIN/Passport`);
      }

      const results = [];
      let created = 0;
      let enrolled = 0;
      let errors = 0;

      // Traiter chaque étudiant individuellement pour gérer les doublons
      for (const studentData of studentsData) {
        try {
          const result = await createStudent(studentData);
          if (result) {
            results.push(result);
            created++;
          }
        } catch (err) {
          // Si l'étudiant existe déjà cette année, compter comme erreur mais continuer
          const message = err instanceof Error ? err.message : 'Erreur';
          if (message.includes('déjà inscrit')) {
            enrolled++;
          } else {
            errors++;
          }
          console.warn(`Erreur pour ${studentData.firstname} ${studentData.lastname}:`, message);
        }
      }
      
      // Message de synthèse
      const messages = [];
      if (created > 0) messages.push(`${created} créé(s)`);
      if (enrolled > 0) messages.push(`${enrolled} déjà inscrit(s)`);
      if (errors > 0) messages.push(`${errors} erreur(s)`);
      
      toast.success(`Import terminé: ${messages.join(', ')}`);
      return results;
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

      // 1. Mettre à jour l'étudiant dans la table students
      const { error: studentError } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id);

      if (studentError) throw studentError;

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

      // 3. Récupérer les données mises à jour via student_school
      const yearId = getYearForDisplay();
      const { data, error: fetchError } = await supabase
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
            parent_phone,
            created_at,
            updated_at
          ),
          classes!inner (
            name
          )
        `)
        .eq('student_id', id)
        .eq('school_year_id', yearId)
        .eq('is_active', true)
        .single();

      if (fetchError) throw fetchError;

      // Transformer au format StudentWithClass
      const transformedData = {
        id: (data as any).students.id,
        firstname: (data as any).students.firstname,
        lastname: (data as any).students.lastname,
        email: (data as any).students.email,
        class_id: data.class_id,
        school_id: data.school_id,
        birth_date: (data as any).students.birth_date,
        cin_number: (data as any).students.cin_number,
        student_phone: (data as any).students.student_phone,
        parent_phone: (data as any).students.parent_phone,
        created_at: (data as any).students.created_at,
        updated_at: (data as any).students.updated_at,
        classes: {
          name: (data as any).classes.name
        }
      };
      
      setStudents(prev => prev.map(student => student.id === id ? transformedData : student));
      toast.success('Étudiant modifié avec succès');
      return transformedData;
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