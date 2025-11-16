import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExamQuestion {
  id?: string;
  question_number: number;
  question_text: string;
  points: number;
  has_choices: boolean;
  is_multiple_choice: boolean;
  answers?: ExamAnswer[];
}

export interface ExamAnswer {
  id?: string;
  answer_text: string;
  is_correct: boolean;
}

export interface ExamDocument {
  id: string;
  school_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  school_year_id: string;
  school_semester_id?: string;
  exam_type: "devoir_surveille" | "controle" | "examen";
  duration_minutes: number;
  documents_allowed: boolean;
  status: "draft" | "submitted" | "approved" | "rejected";
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useExamDocuments = (schoolId?: string, teacherId?: string) => {
  const queryClient = useQueryClient();

  const { data: examDocuments, isLoading } = useQuery({
    queryKey: ["exam-documents", schoolId, teacherId],
    queryFn: async () => {
      let query = supabase
        .from("exam_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (schoolId) {
        query = query.eq("school_id", schoolId);
      }
      if (teacherId) {
        query = query.eq("teacher_id", teacherId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExamDocument[];
    },
    enabled: !!schoolId || !!teacherId,
  });

  const createExamDocument = useMutation({
    mutationFn: async (examData: {
      school_id: string;
      teacher_id: string;
      subject_id: string;
      class_id: string;
      school_year_id: string;
      school_semester_id?: string;
      exam_type: string;
      duration_minutes: number;
      documents_allowed: boolean;
      questions: ExamQuestion[];
    }) => {
      const { questions, ...documentData } = examData;

      // Create exam document
      const { data: exam, error: examError } = await supabase
        .from("exam_documents")
        .insert(documentData)
        .select()
        .single();

      if (examError) throw examError;

      // Create questions
      for (const question of questions) {
        const { answers, ...questionData } = question;
        
        const { data: createdQuestion, error: questionError } = await supabase
          .from("exam_questions")
          .insert({
            ...questionData,
            exam_document_id: exam.id,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create answers if present
        if (answers && answers.length > 0) {
          const answersToInsert = answers.map((answer) => ({
            question_id: createdQuestion.id,
            answer_text: answer.answer_text,
            is_correct: answer.is_correct,
          }));

          const { error: answersError } = await supabase
            .from("exam_answers")
            .insert(answersToInsert);

          if (answersError) throw answersError;
        }
      }

      return exam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-documents"] });
      toast.success("Document d'examen créé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du document");
      console.error(error);
    },
  });

  const submitExamDocument = useMutation({
    mutationFn: async (examId: string) => {
      const { data, error } = await supabase
        .from("exam_documents")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", examId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-documents"] });
      toast.success("Document soumis à l'administration");
    },
    onError: (error) => {
      toast.error("Erreur lors de la soumission");
      console.error(error);
    },
  });

  const deleteExamDocument = useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from("exam_documents")
        .delete()
        .eq("id", examId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-documents"] });
      toast.success("Document supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  return {
    examDocuments: examDocuments || [],
    isLoading,
    createExamDocument,
    submitExamDocument,
    deleteExamDocument,
  };
};

export const useExamQuestions = (examDocumentId?: string) => {
  return useQuery({
    queryKey: ["exam-questions", examDocumentId],
    queryFn: async () => {
      if (!examDocumentId) return [];

      const { data, error } = await supabase
        .from("exam_questions")
        .select(`
          *,
          exam_answers (*)
        `)
        .eq("exam_document_id", examDocumentId)
        .order("question_number", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!examDocumentId,
  });
};
