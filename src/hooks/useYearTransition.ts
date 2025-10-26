import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface YearPreparation {
  id: string;
  school_id: string;
  from_year_id: string;
  to_year_id: string;
  status: 'draft' | 'classes_created' | 'mapping_done' | 'completed';
  classes_created_at?: string;
  mapping_completed_at?: string;
  students_promoted_at?: string;
  created_at: string;
  updated_at: string;
}

interface ClassTransition {
  id: string;
  preparation_id: string;
  from_class_id: string;
  to_class_id: string;
  created_at: string;
}

interface StudentTransition {
  id: string;
  preparation_id: string;
  student_id: string;
  from_class_id: string;
  to_class_id: string | null;
  transition_type: 'promoted' | 'retained' | 'departed' | 'transferred';
  notes?: string;
  created_at: string;
}

export const useYearTransition = (schoolId: string) => {
  const [loading, setLoading] = useState(false);
  const [currentPreparation, setCurrentPreparation] = useState<YearPreparation | null>(null);

  const getOrCreatePreparation = async (fromYearId: string, toYearId: string) => {
    try {
      setLoading(true);
      
      // Vérifier si une préparation existe déjà
      const { data: existing, error: fetchError } = await supabase
        .from('year_preparations' as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('from_year_id', fromYearId)
        .eq('to_year_id', toYearId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        setCurrentPreparation(existing as unknown as YearPreparation);
        return existing as unknown as YearPreparation;
      }

      // Créer une nouvelle préparation
      const { data: newPrep, error: insertError } = await supabase
        .from('year_preparations' as any)
        .insert([{
          school_id: schoolId,
          from_year_id: fromYearId,
          to_year_id: toYearId,
          status: 'draft'
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setCurrentPreparation(newPrep as unknown as YearPreparation);
      toast.success('Préparation de la nouvelle année initialisée');
      return newPrep as unknown as YearPreparation;
    } catch (error: any) {
      toast.error('Erreur lors de l\'initialisation: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createClassForNewYear = async (
    className: string,
    toYearId: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('classes' as any)
        .insert([{
          name: className,
          school_id: schoolId,
          school_year_id: toYearId
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast.error('Erreur lors de la création de la classe: ' + error.message);
      throw error;
    }
  };

  const duplicateCurrentClasses = async (fromYearId: string, toYearId: string) => {
    try {
      setLoading(true);

      // Récupérer les classes de l'année actuelle
      const { data: currentClasses, error: fetchError } = await supabase
        .from('classes' as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('school_year_id', fromYearId);

      if (fetchError) throw fetchError;

      if (!currentClasses || currentClasses.length === 0) {
        toast.error('Aucune classe à dupliquer pour l\'année actuelle');
        return [];
      }

      // Créer les mêmes classes pour la nouvelle année
      const newClasses = currentClasses.map((cls: any) => ({
        name: cls.name,
        school_id: schoolId,
        school_year_id: toYearId
      }));

      const { data: createdClasses, error: insertError } = await supabase
        .from('classes' as any)
        .insert(newClasses)
        .select();

      if (insertError) throw insertError;

      toast.success(`${createdClasses?.length || 0} classes créées pour la nouvelle année`);
      return createdClasses;
    } catch (error: any) {
      toast.error('Erreur lors de la duplication des classes: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePreparationStatus = async (
    preparationId: string,
    status: YearPreparation['status'],
    timestampField?: 'classes_created_at' | 'mapping_completed_at' | 'students_promoted_at'
  ) => {
    try {
      const updateData: any = { status };
      if (timestampField) {
        updateData[timestampField] = new Date().toISOString();
      }

      const { error } = await supabase
        .from('year_preparations' as any)
        .update(updateData)
        .eq('id', preparationId);

      if (error) throw error;

      // Mettre à jour l'état local
      if (currentPreparation) {
        setCurrentPreparation({
          ...currentPreparation,
          status,
          ...(timestampField && { [timestampField]: new Date().toISOString() })
        });
      }
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour du statut: ' + error.message);
      throw error;
    }
  };

  const createClassMapping = async (
    preparationId: string,
    fromClassId: string,
    toClassId: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('class_transitions' as any)
        .insert([{
          preparation_id: preparationId,
          from_class_id: fromClassId,
          to_class_id: toClassId
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ClassTransition;
    } catch (error: any) {
      toast.error('Erreur lors de la création du mapping: ' + error.message);
      throw error;
    }
  };

  const getClassMappings = async (preparationId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_transitions' as any)
        .select('*')
        .eq('preparation_id', preparationId);

      if (error) throw error;
      return data as unknown as ClassTransition[];
    } catch (error: any) {
      toast.error('Erreur lors de la récupération des mappings: ' + error.message);
      return [];
    }
  };

  const deleteClassMapping = async (mappingId: string) => {
    try {
      const { error } = await supabase
        .from('class_transitions' as any)
        .delete()
        .eq('id', mappingId);

      if (error) throw error;
    } catch (error: any) {
      toast.error('Erreur lors de la suppression du mapping: ' + error.message);
      throw error;
    }
  };

  const promoteStudents = async (
    preparationId: string,
    transitions: {
      student_id: string;
      from_class_id: string;
      to_class_id: string | null;
      transition_type: StudentTransition['transition_type'];
      notes?: string;
    }[]
  ) => {
    try {
      setLoading(true);

      // Créer les enregistrements de transition
      const transitionRecords = transitions.map(t => ({
        preparation_id: preparationId,
        student_id: t.student_id,
        from_class_id: t.from_class_id,
        to_class_id: t.to_class_id,
        transition_type: t.transition_type,
        notes: t.notes
      }));

      const { error: transitionError } = await supabase
        .from('student_transitions' as any)
        .insert(transitionRecords);

      if (transitionError) throw transitionError;

      // Pour les étudiants promus ou redoublants, créer/mettre à jour leur student_school
      const studentsToEnroll = transitions.filter(
        t => t.transition_type === 'promoted' || t.transition_type === 'retained'
      );

      if (studentsToEnroll.length > 0) {
        // Récupérer l'info de préparation pour avoir le to_year_id
        const { data: prep, error: prepError } = await supabase
          .from('year_preparations' as any)
          .select('to_year_id')
          .eq('id', preparationId)
          .single();

        if (prepError) throw prepError;

        if (prep) {
          const prepData = prep as unknown as { to_year_id: string };
          
          const enrollments = studentsToEnroll
            .filter(t => t.to_class_id) // Seulement si une classe est assignée
            .map(t => ({
              student_id: t.student_id,
              school_id: schoolId,
              school_year_id: prepData.to_year_id,
              class_id: t.to_class_id,
              is_active: true
            }));

          if (enrollments.length > 0) {
            const { error: enrollError } = await supabase
              .from('student_school' as any)
              .insert(enrollments);

            if (enrollError) throw enrollError;
          }
        }
      }

      toast.success(`${transitions.length} transitions d'étudiants enregistrées`);
      return true;
    } catch (error: any) {
      toast.error('Erreur lors de la promotion des étudiants: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStudentsByClass = async (classId: string, yearId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_school' as any)
        .select(`
          id,
          student_id,
          class_id,
          students:student_id (
            id,
            firstname,
            lastname,
            cin_number,
            email
          )
        `)
        .eq('class_id', classId)
        .eq('school_year_id', yearId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast.error('Erreur lors de la récupération des étudiants: ' + error.message);
      return [];
    }
  };

  return {
    loading,
    currentPreparation,
    getOrCreatePreparation,
    createClassForNewYear,
    duplicateCurrentClasses,
    updatePreparationStatus,
    createClassMapping,
    getClassMappings,
    deleteClassMapping,
    promoteStudents,
    getStudentsByClass
  };
};
