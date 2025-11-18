import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export interface QuestionWithAnswers extends ExamQuestion {
  answers: ExamAnswer[];
}

export const useExamQuestions = (examDocumentId?: string) => {
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQuestions = async () => {
    if (!examDocumentId) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_document_id', examDocumentId)
        .order('question_number', { ascending: true });

      if (questionsError) throw questionsError;

      // Fetch answers for each question
      const questionsWithAnswers = await Promise.all(
        (questionsData || []).map(async (question) => {
          const { data: answersData, error: answersError } = await supabase
            .from('exam_answers')
            .select('*')
            .eq('question_id', question.id);

          if (answersError) throw answersError;

          return {
            ...question,
            answers: answersData || []
          };
        })
      );

      setQuestions(questionsWithAnswers);
    } catch (err) {
      console.error('Error fetching exam questions:', err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async (questionData: {
    exam_document_id: string;
    question_number: number;
    question_text: string;
    points: number;
    has_choices: boolean;
    is_multiple_choice: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .insert([questionData])
        .select()
        .single();

      if (error) throw error;

      await fetchQuestions();
      return { data, error: null };
    } catch (err) {
      console.error('Error creating question:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer la question",
        variant: "destructive",
      });
      return { data: null, error: err };
    }
  };

  const updateQuestion = async (id: string, updates: Partial<ExamQuestion>) => {
    try {
      const { error } = await supabase
        .from('exam_questions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchQuestions();
      return { error: null };
    } catch (err) {
      console.error('Error updating question:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la question",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      // Delete answers first
      await supabase
        .from('exam_answers')
        .delete()
        .eq('question_id', id);

      // Then delete question
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchQuestions();
      return { error: null };
    } catch (err) {
      console.error('Error deleting question:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la question",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const createAnswer = async (answerData: {
    question_id: string;
    answer_text: string;
    is_correct: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('exam_answers')
        .insert([answerData])
        .select()
        .single();

      if (error) throw error;

      await fetchQuestions();
      return { data, error: null };
    } catch (err) {
      console.error('Error creating answer:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer la réponse",
        variant: "destructive",
      });
      return { data: null, error: err };
    }
  };

  const deleteAnswer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exam_answers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchQuestions();
      return { error: null };
    } catch (err) {
      console.error('Error deleting answer:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réponse",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [examDocumentId]);

  return {
    questions,
    loading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    createAnswer,
    deleteAnswer,
    refetch: fetchQuestions
  };
};
