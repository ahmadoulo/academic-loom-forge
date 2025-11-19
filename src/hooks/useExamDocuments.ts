import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ExamQuestion {
  id: string;
  exam_document_id: string;
  question_number: number;
  question_text: string;
  points: number;
  has_choices: boolean;
  is_multiple_choice: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  created_at: string;
}

export interface ExamDocument {
  id: string;
  school_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  school_year_id: string;
  school_semester_id: string | null;
  exam_type: string;
  duration_minutes: number;
  documents_allowed: boolean;
  status: string;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  teachers?: {
    id: string;
    firstname: string;
    lastname: string;
  };
  subjects?: {
    id: string;
    name: string;
  };
  classes?: {
    id: string;
    name: string;
  };
}

export interface CreateExamDocumentData {
  subject_id: string;
  class_id: string;
  exam_type: string;
  duration_minutes: number;
  documents_allowed: boolean;
  school_year_id: string;
  school_semester_id?: string;
}

export interface CreateQuestionData {
  question_text: string;
  points: number;
  has_choices: boolean;
  is_multiple_choice: boolean;
  answers?: { answer_text: string; is_correct: boolean }[];
}

export const useExamDocuments = (teacherId?: string, schoolId?: string) => {
  const [examDocuments, setExamDocuments] = useState<ExamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExamDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('exam_documents')
        .select(`
          *,
          teachers (id, firstname, lastname),
          subjects (id, name),
          classes (id, name)
        `)
        .order('created_at', { ascending: false });

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setExamDocuments(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des documents d\'examen';
      setError(message);
      console.error('Erreur chargement documents d\'examen:', err);
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createExamDocument = async (
    data: CreateExamDocumentData,
    teacherId: string,
    schoolId: string
  ) => {
    try {
      const { data: examDoc, error: createError } = await supabase
        .from('exam_documents')
        .insert({
          ...data,
          teacher_id: teacherId,
          school_id: schoolId,
          status: 'draft'
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: "Succès",
        description: "Document d'examen créé avec succès"
      });

      await fetchExamDocuments();
      return examDoc;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du document';
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const addQuestion = async (
    examDocumentId: string,
    questionData: CreateQuestionData,
    questionNumber: number
  ) => {
    try {
      const { data: question, error: questionError } = await supabase
        .from('exam_questions')
        .insert({
          exam_document_id: examDocumentId,
          question_number: questionNumber,
          question_text: questionData.question_text,
          points: questionData.points,
          has_choices: questionData.has_choices,
          is_multiple_choice: questionData.is_multiple_choice
        })
        .select()
        .single();

      if (questionError) throw questionError;

      if (questionData.has_choices && questionData.answers && questionData.answers.length > 0) {
        const answersToInsert = questionData.answers.map(answer => ({
          question_id: question.id,
          answer_text: answer.answer_text,
          is_correct: answer.is_correct
        }));

        const { error: answersError } = await supabase
          .from('exam_answers')
          .insert(answersToInsert);

        if (answersError) throw answersError;
      }

      toast({
        title: "Succès",
        description: "Question ajoutée avec succès"
      });

      return question;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la question';
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const getExamWithQuestions = async (examDocumentId: string) => {
    try {
      const { data: questions, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_document_id', examDocumentId)
        .order('question_number');

      if (questionsError) throw questionsError;

      const questionsWithAnswers = await Promise.all(
        (questions || []).map(async (question) => {
          const { data: answers } = await supabase
            .from('exam_answers')
            .select('*')
            .eq('question_id', question.id);

          return { ...question, answers: answers || [] };
        })
      );

      return questionsWithAnswers;
    } catch (err) {
      console.error('Erreur lors du chargement des questions:', err);
      throw err;
    }
  };

  const submitExamDocument = async (examDocumentId: string) => {
    try {
      const { error: submitError } = await supabase
        .from('exam_documents')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', examDocumentId);

      if (submitError) throw submitError;

      toast({
        title: "Succès",
        description: "Document d'examen soumis à l'administration"
      });

      await fetchExamDocuments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la soumission';
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteExamDocument = async (examDocumentId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('exam_documents')
        .delete()
        .eq('id', examDocumentId)
        .eq('status', 'draft');

      if (deleteError) throw deleteError;

      toast({
        title: "Succès",
        description: "Document supprimé"
      });

      await fetchExamDocuments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchExamDocuments();
  }, [teacherId, schoolId]);

  return {
    examDocuments,
    loading,
    error,
    createExamDocument,
    addQuestion,
    getExamWithQuestions,
    submitExamDocument,
    deleteExamDocument,
    refetch: fetchExamDocuments
  };
};
