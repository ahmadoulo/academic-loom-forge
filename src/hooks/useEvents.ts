import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  location: string | null;
  created_by: string | null;
  scope: 'school' | 'class' | 'subject' | 'public';
  class_id: string | null;
  subject_id: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface UseEventsOptions {
  from?: Date;
  to?: Date;
  scope?: string;
  classId?: string;
  subjectId?: string;
}

export const useEvents = (options?: UseEventsOptions) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('events')
        .select('*')
        .eq('published', true)
        .order('start_at', { ascending: true });

      if (options?.from) {
        query = query.gte('start_at', options.from.toISOString());
      }

      if (options?.to) {
        query = query.lte('start_at', options.to.toISOString());
      }

      if (options?.scope) {
        query = query.eq('scope', options.scope);
      }

      if (options?.classId) {
        query = query.eq('class_id', options.classId);
      }

      if (options?.subjectId) {
        query = query.eq('subject_id', options.subjectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents((data || []) as Event[]);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les événements',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options?.from, options?.to, options?.scope, options?.classId, options?.subjectId]);

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) throw error;

      toast({
        title: 'Événement créé',
        description: 'L\'événement a été créé avec succès',
      });

      fetchEvents();
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer l\'événement',
      });
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Événement modifié',
        description: 'L\'événement a été modifié avec succès',
      });

      fetchEvents();
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de modifier l\'événement',
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Événement supprimé',
        description: 'L\'événement a été supprimé avec succès',
      });

      fetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer l\'événement',
      });
    }
  };

  return {
    events,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
};
