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
  answers?: Array<{
    id?: string;
    answer_text: string;
    is_correct: boolean;
  }>;
}

export interface CreateExamDocumentData {
  subject_id: string;
  class_id: string;
  exam_type: string;
  duration_minutes: number;
  documents_allowed: boolean;
  questions: ExamQuestion[];
}

export const useExamDocuments = (teacherId?: string, schoolId?: string) => {
  const queryClient = useQueryClient();

  // Fetch exam documents for teacher
  const { data: teacherExams, isLoading: isLoadingTeacherExams } = useQuery({
    queryKey: ["exam-documents", "teacher", teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      
      const { data, error } = await supabase
        .from("exam_documents")
        .select(`
          *,
          subjects (name),
          classes (name),
          teachers (firstname, lastname),
          school_years (name),
          school_semester (name)
        `)
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!teacherId,
  });

  // Fetch exam documents for school admin
  const { data: schoolExams, isLoading: isLoadingSchoolExams } = useQuery({
    queryKey: ["exam-documents", "school", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      
      const { data, error } = await supabase
        .from("exam_documents")
        .select(`
          *,
          subjects (name),
          classes (name),
          teachers (firstname, lastname),
          school_years (name),
          school_semester (name)
        `)
        .eq("school_id", schoolId)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });

  // Fetch questions for a specific exam
  const fetchExamQuestions = async (examId: string) => {
    const { data, error } = await supabase
      .from("exam_questions")
      .select(`
        *,
        exam_answers (*)
      `)
      .eq("exam_document_id", examId)
      .order("question_number", { ascending: true });

    if (error) throw error;
    return data;
  };

  // Create exam document
  const createExamMutation = useMutation({
    mutationFn: async ({
      data,
      teacherId,
      schoolId,
      schoolYearId,
      schoolSemesterId,
    }: {
      data: CreateExamDocumentData;
      teacherId: string;
      schoolId: string;
      schoolYearId: string;
      schoolSemesterId: string | null;
    }) => {
      // Create exam document
      const { data: examDoc, error: examError } = await supabase
        .from("exam_documents")
        .insert({
          school_id: schoolId,
          teacher_id: teacherId,
          subject_id: data.subject_id,
          class_id: data.class_id,
          school_year_id: schoolYearId,
          school_semester_id: schoolSemesterId,
          exam_type: data.exam_type,
          duration_minutes: data.duration_minutes,
          documents_allowed: data.documents_allowed,
          status: "draft",
        })
        .select()
        .single();

      if (examError) throw examError;

      // Create questions and answers
      for (const question of data.questions) {
        const { data: questionDoc, error: questionError } = await supabase
          .from("exam_questions")
          .insert({
            exam_document_id: examDoc.id,
            question_number: question.question_number,
            question_text: question.question_text,
            points: question.points,
            has_choices: question.has_choices,
            is_multiple_choice: question.is_multiple_choice,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create answers if any
        if (question.answers && question.answers.length > 0) {
          const { error: answersError } = await supabase
            .from("exam_answers")
            .insert(
              question.answers.map((answer) => ({
                question_id: questionDoc.id,
                answer_text: answer.answer_text,
                is_correct: answer.is_correct,
              }))
            );

          if (answersError) throw answersError;
        }
      }

      return examDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-documents"] });
      toast.success("Document d'examen créé avec succès");
    },
    onError: (error) => {
      console.error("Error creating exam:", error);
      toast.error("Erreur lors de la création du document d'examen");
    },
  });

  // Submit exam for review
  const submitExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from("exam_documents")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", examId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-documents"] });
      toast.success("Document soumis pour validation");
    },
    onError: () => {
      toast.error("Erreur lors de la soumission");
    },
  });

  // Review exam (school admin)
  const reviewExamMutation = useMutation({
    mutationFn: async ({
      examId,
      reviewerId,
      approved,
    }: {
      examId: string;
      reviewerId: string;
      approved: boolean;
    }) => {
      const { error } = await supabase
        .from("exam_documents")
        .update({
          status: approved ? "approved" : "rejected",
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", examId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-documents"] });
      toast.success("Document validé");
    },
    onError: () => {
      toast.error("Erreur lors de la validation");
    },
  });

  // Delete exam
  const deleteExamMutation = useMutation({
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
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  return {
    teacherExams,
    schoolExams,
    isLoadingTeacherExams,
    isLoadingSchoolExams,
    fetchExamQuestions,
    createExam: createExamMutation.mutateAsync,
    submitExam: submitExamMutation.mutateAsync,
    reviewExam: reviewExamMutation.mutateAsync,
    deleteExam: deleteExamMutation.mutateAsync,
    isCreating: createExamMutation.isPending,
  };
};
