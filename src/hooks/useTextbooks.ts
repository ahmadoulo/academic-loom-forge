import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Textbook {
  id: string;
  school_id: string;
  class_id: string;
  school_year_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  classes?: {
    id: string;
    name: string;
  };
}

export interface TextbookEntry {
  id: string;
  textbook_id: string;
  teacher_id: string;
  subject_id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  lesson_content: string;
  homework_given: string | null;
  homework_due_date: string | null;
  next_session_plan: string | null;
  resources_links: string | null;
  observations: string | null;
  chapter_title: string | null;
  objectives_covered: string | null;
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
}

export interface TextbookNote {
  id: string;
  textbook_id: string;
  created_by: string | null;
  target_teacher_id: string | null;
  note_content: string;
  is_visible_to_all: boolean;
  created_at: string;
  updated_at: string;
  user_credentials?: {
    first_name: string;
    last_name: string;
  };
  teachers?: {
    firstname: string;
    lastname: string;
  };
}

export const useTextbooks = (schoolId?: string, schoolYearId?: string) => {
  const queryClient = useQueryClient();

  const { data: textbooks = [], isLoading, refetch } = useQuery({
    queryKey: ['textbooks', schoolId, schoolYearId],
    queryFn: async () => {
      if (!schoolId) return [];
      
      let query = supabase
        .from('school_textbooks')
        .select(`
          *,
          classes (id, name)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (schoolYearId) {
        query = query.eq('school_year_id', schoolYearId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Textbook[];
    },
    enabled: !!schoolId,
  });

  const createTextbook = useMutation({
    mutationFn: async (textbook: {
      school_id: string;
      class_id: string;
      school_year_id: string;
      name: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('school_textbooks')
        .insert(textbook)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbooks'] });
      toast({ title: 'Cahier de texte créé avec succès' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erreur', 
        description: error.message?.includes('duplicate') 
          ? 'Un cahier de texte existe déjà pour cette classe' 
          : error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateTextbook = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Textbook> & { id: string }) => {
      const { data, error } = await supabase
        .from('school_textbooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbooks'] });
      toast({ title: 'Cahier de texte mis à jour' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTextbook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('school_textbooks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbooks'] });
      toast({ title: 'Cahier de texte supprimé' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    textbooks,
    isLoading,
    refetch,
    createTextbook,
    updateTextbook,
    deleteTextbook,
  };
};

export const useTextbookEntries = (textbookId?: string, teacherId?: string) => {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['textbook-entries', textbookId, teacherId],
    queryFn: async () => {
      if (!textbookId) return [];
      
      let query = supabase
        .from('school_textbook_entries')
        .select(`
          *,
          teachers (id, firstname, lastname),
          subjects (id, name)
        `)
        .eq('textbook_id', textbookId)
        .order('session_date', { ascending: false });

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TextbookEntry[];
    },
    enabled: !!textbookId,
  });

  const createEntry = useMutation({
    mutationFn: async (entry: {
      textbook_id: string;
      teacher_id: string;
      subject_id: string;
      session_date: string;
      start_time?: string;
      end_time?: string;
      lesson_content: string;
      homework_given?: string;
      homework_due_date?: string;
      next_session_plan?: string;
      resources_links?: string;
      observations?: string;
      chapter_title?: string;
      objectives_covered?: string;
    }) => {
      const { data, error } = await supabase
        .from('school_textbook_entries')
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbook-entries'] });
      toast({ title: 'Entrée ajoutée au cahier de texte' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TextbookEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('school_textbook_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbook-entries'] });
      toast({ title: 'Entrée mise à jour' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('school_textbook_entries')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbook-entries'] });
      toast({ title: 'Entrée supprimée' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    entries,
    isLoading,
    refetch,
    createEntry,
    updateEntry,
    deleteEntry,
  };
};

export const useTextbookNotes = (textbookId?: string, teacherId?: string) => {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading, refetch } = useQuery({
    queryKey: ['textbook-notes', textbookId, teacherId],
    queryFn: async () => {
      if (!textbookId) return [];
      
      let query = supabase
        .from('school_textbook_notes')
        .select(`
          *,
          user_credentials (first_name, last_name),
          teachers (firstname, lastname)
        `)
        .eq('textbook_id', textbookId)
        .order('created_at', { ascending: false });

      // If teacherId provided, filter notes visible to that teacher
      if (teacherId) {
        query = query.or(`is_visible_to_all.eq.true,target_teacher_id.eq.${teacherId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TextbookNote[];
    },
    enabled: !!textbookId,
  });

  const createNote = useMutation({
    mutationFn: async (note: {
      textbook_id: string;
      created_by?: string;
      target_teacher_id?: string;
      note_content: string;
      is_visible_to_all: boolean;
    }) => {
      const { data, error } = await supabase
        .from('school_textbook_notes')
        .insert(note)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbook-notes'] });
      toast({ title: 'Note ajoutée' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('school_textbook_notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbook-notes'] });
      toast({ title: 'Note supprimée' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    notes,
    isLoading,
    refetch,
    createNote,
    deleteNote,
  };
};

export const useTeacherTextbooks = (teacherId?: string, schoolYearId?: string) => {
  const { data: textbooks = [], isLoading } = useQuery({
    queryKey: ['teacher-textbooks', teacherId, schoolYearId],
    queryFn: async () => {
      if (!teacherId) return [];

      // Get teacher's assigned classes
      const { data: teacherClasses, error: tcError } = await supabase
        .from('teacher_classes')
        .select('class_id')
        .eq('teacher_id', teacherId);

      if (tcError) throw tcError;
      if (!teacherClasses?.length) return [];

      const classIds = teacherClasses.map(tc => tc.class_id);

      // Get textbooks for those classes
      let query = supabase
        .from('school_textbooks')
        .select(`
          *,
          classes (id, name)
        `)
        .in('class_id', classIds)
        .eq('is_active', true);

      if (schoolYearId) {
        query = query.eq('school_year_id', schoolYearId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Textbook[];
    },
    enabled: !!teacherId,
  });

  return { textbooks, isLoading };
};
