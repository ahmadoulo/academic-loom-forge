import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OnlineExam {
  id: string;
  school_id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  school_year_id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  allow_window_switch: boolean;
  max_warnings: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  classes?: { name: string };
  subjects?: { name: string };
}

export interface OnlineExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_order: number;
  points: number;
  created_at: string;
}

export interface OnlineExamAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  created_at: string;
}

export interface StudentExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at?: string;
  score?: number;
  warning_count: number;
  status: string;
  created_at: string;
  students?: { firstname: string; lastname: string };
}

export interface StudentExamResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer_id?: string;
  is_correct?: boolean;
  created_at: string;
}

export const useOnlineExams = (teacherId?: string, classId?: string) => {
  const queryClient = useQueryClient();

  // Fetch teacher's exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ['online-exams', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      
      const { data, error } = await supabase
        .from('online_exams')
        .select(`
          *,
          classes(name),
          subjects(name)
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OnlineExam[];
    },
    enabled: !!teacherId,
  });

  // Fetch student's exams with attempts
  const { data: studentExamsData, isLoading: isLoadingStudentExams } = useQuery({
    queryKey: ['student-online-exams', classId],
    queryFn: async () => {
      if (!classId) return { exams: [], attempts: [] };
      
      const { data: examsData, error: examsError } = await supabase
        .from('online_exams')
        .select(`
          *,
          subjects(name)
        `)
        .eq('class_id', classId)
        .eq('is_published', true)
        .order('start_time', { ascending: false });

      if (examsError) throw examsError;
      
      return { exams: examsData as OnlineExam[], attempts: [] };
    },
    enabled: !!classId,
  });

  const studentExams = studentExamsData?.exams || [];
  
  // Check if student has already attempted an exam
  const checkExamAttempt = async (examId: string, studentId: string) => {
    const { data, error } = await supabase
      .from('student_exam_attempts')
      .select('id, status, score')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  // Fetch exam with questions and answers
  const fetchExamWithDetails = async (examId: string) => {
    const { data: exam, error: examError } = await supabase
      .from('online_exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (examError) throw examError;

    const { data: questions, error: questionsError } = await supabase
      .from('online_exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('question_order');

    if (questionsError) throw questionsError;

    const questionIds = questions.map(q => q.id);
    const { data: answers, error: answersError } = await supabase
      .from('online_exam_answers')
      .select('*')
      .in('question_id', questionIds);

    if (answersError) throw answersError;

    return { exam, questions, answers };
  };

  // Create exam
  const createExam = useMutation({
    mutationFn: async (examData: {
      exam: {
        school_id: string;
        teacher_id: string;
        class_id: string;
        subject_id: string;
        school_year_id: string;
        title: string;
        description?: string;
        duration_minutes: number;
        start_time: string;
        end_time: string;
        allow_window_switch: boolean;
        max_warnings: number;
        is_published: boolean;
      };
      questions: Array<{
        question_text: string;
        points: number;
        answers: Array<{ answer_text: string; is_correct: boolean }>;
      }>;
    }) => {
      // Create exam
      const { data: exam, error: examError } = await supabase
        .from('online_exams')
        .insert([examData.exam])
        .select()
        .single();

      if (examError) throw examError;

      // Create questions and answers
      for (let i = 0; i < examData.questions.length; i++) {
        const questionData = examData.questions[i];
        
        const { data: question, error: questionError } = await supabase
          .from('online_exam_questions')
          .insert({
            exam_id: exam.id,
            question_text: questionData.question_text,
            points: questionData.points,
            question_order: i + 1,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        const answers = questionData.answers.map(a => ({
          question_id: question.id,
          answer_text: a.answer_text,
          is_correct: a.is_correct,
        }));

        const { error: answersError } = await supabase
          .from('online_exam_answers')
          .insert(answers);

        if (answersError) throw answersError;
      }

      return exam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-exams'] });
      toast.success('Examen créé avec succès');
    },
    onError: (error) => {
      console.error('Error creating exam:', error);
      toast.error('Erreur lors de la création de l\'examen');
    },
  });

  // Publish exam
  const publishExam = useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from('online_exams')
        .update({ is_published: true })
        .eq('id', examId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-exams'] });
      toast.success('Examen publié');
    },
    onError: () => {
      toast.error('Erreur lors de la publication');
    },
  });

  // Delete exam
  const deleteExam = useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from('online_exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-exams'] });
      toast.success('Examen supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  // Reset student attempt (give second chance)
  const resetStudentAttempt = useMutation({
    mutationFn: async ({ attemptId }: { attemptId: string }) => {
      // Delete responses first
      const { error: responsesError } = await supabase
        .from('student_exam_responses')
        .delete()
        .eq('attempt_id', attemptId);

      if (responsesError) throw responsesError;

      // Delete attempt
      const { error: attemptError } = await supabase
        .from('student_exam_attempts')
        .delete()
        .eq('id', attemptId);

      if (attemptError) throw attemptError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
      toast.success('L\'étudiant peut repasser l\'examen');
    },
    onError: () => {
      toast.error('Erreur lors de la réinitialisation');
    },
  });

  // Update exam
  const updateExam = useMutation({
    mutationFn: async (examData: {
      examId: string;
      exam: Partial<{
        title: string;
        description: string;
        duration_minutes: number;
        start_time: string;
        end_time: string;
        allow_window_switch: boolean;
        max_warnings: number;
      }>;
    }) => {
      const { error } = await supabase
        .from('online_exams')
        .update(examData.exam)
        .eq('id', examData.examId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-exams'] });
      toast.success('Examen modifié avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification');
    },
  });

  // Update question
  const updateQuestion = useMutation({
    mutationFn: async ({ questionId, question_text, points }: { questionId: string; question_text: string; points: number }) => {
      const { error } = await supabase
        .from('online_exam_questions')
        .update({ question_text, points })
        .eq('id', questionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-exams'] });
    },
    onError: () => {
      toast.error('Erreur lors de la modification de la question');
    },
  });

  // Delete question
  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      // Delete answers first
      const { error: answersError } = await supabase
        .from('online_exam_answers')
        .delete()
        .eq('question_id', questionId);

      if (answersError) throw answersError;

      // Then delete question
      const { error } = await supabase
        .from('online_exam_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-exams'] });
      toast.success('Question supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la question');
    },
  });

  // Update answer
  const updateAnswer = useMutation({
    mutationFn: async ({ answerId, answer_text, is_correct }: { answerId: string; answer_text: string; is_correct: boolean }) => {
      const { error } = await supabase
        .from('online_exam_answers')
        .update({ answer_text, is_correct })
        .eq('id', answerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-exams'] });
    },
    onError: () => {
      toast.error('Erreur lors de la modification de la réponse');
    },
  });

  // Fetch exam attempts
  const { data: attempts = [] } = useQuery({
    queryKey: ['exam-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_exam_attempts')
        .select(`
          *,
          students(firstname, lastname)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StudentExamAttempt[];
    },
  });

  return {
    exams,
    studentExams,
    isLoadingExams,
    isLoadingStudentExams,
    attempts,
    createExam: createExam.mutateAsync,
    publishExam: publishExam.mutateAsync,
    deleteExam: deleteExam.mutateAsync,
    resetStudentAttempt: resetStudentAttempt.mutateAsync,
    updateExam: updateExam.mutateAsync,
    updateQuestion: updateQuestion.mutateAsync,
    deleteQuestion: deleteQuestion.mutateAsync,
    updateAnswer: updateAnswer.mutateAsync,
    fetchExamWithDetails,
    checkExamAttempt,
    isCreating: createExam.isPending,
  };
};
