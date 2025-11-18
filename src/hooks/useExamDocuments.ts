import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  subjects?: {
    name: string;
  };
  classes?: {
    name: string;
  };
  teachers?: {
    firstname: string;
    lastname: string;
  };
}

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

export const useExamDocuments = (schoolId?: string, teacherId?: string) => {
  const [documents, setDocuments] = useState<ExamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('exam_documents')
        .select(`
          *,
          subjects (name),
          classes (name),
          teachers (firstname, lastname)
        `)
        .order('created_at', { ascending: false });

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching exam documents:', err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents d'examen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (documentData: {
    school_id: string;
    teacher_id: string;
    subject_id: string;
    class_id: string;
    school_year_id: string;
    school_semester_id?: string;
    exam_type: string;
    duration_minutes: number;
    documents_allowed: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('exam_documents')
        .insert([{ ...documentData, status: 'draft' }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Document créé",
        description: "Le document d'examen a été créé avec succès",
      });

      await fetchDocuments();
      return { data, error: null };
    } catch (err) {
      console.error('Error creating exam document:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le document d'examen",
        variant: "destructive",
      });
      return { data: null, error: err };
    }
  };

  const updateDocument = async (id: string, updates: Partial<ExamDocument>) => {
    try {
      const { error } = await supabase
        .from('exam_documents')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Document mis à jour",
        description: "Le document d'examen a été mis à jour avec succès",
      });

      await fetchDocuments();
      return { error: null };
    } catch (err) {
      console.error('Error updating exam document:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le document d'examen",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const submitDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exam_documents')
        .update({ 
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Document soumis",
        description: "Le document a été soumis à l'administration",
      });

      await fetchDocuments();
      return { error: null };
    } catch (err) {
      console.error('Error submitting exam document:', err);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre le document",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exam_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Document supprimé",
        description: "Le document d'examen a été supprimé",
      });

      await fetchDocuments();
      return { error: null };
    } catch (err) {
      console.error('Error deleting exam document:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  useEffect(() => {
    fetchDocuments();

    const channel = supabase
      .channel('exam-documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_documents'
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId, teacherId]);

  return {
    documents,
    loading,
    createDocument,
    updateDocument,
    submitDocument,
    deleteDocument,
    refetch: fetchDocuments
  };
};
