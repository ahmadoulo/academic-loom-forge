import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  location: string | null;
  created_by: string | null;
  scope: string;
  class_id: string | null;
  subject_id: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export const useEvents = (schoolId?: string) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from("events" as any)
        .select("*")
        .eq("published", true);
      
      // Filtrer par school_id si fourni
      if (schoolId) {
        console.log("🔍 Filtrage des événements par school_id:", schoolId);
        query = query.eq("school_id", schoolId);
      } else {
        console.log("⚠️ Aucun school_id fourni, tous les événements seront affichés");
      }
      
      const { data, error } = await query
        .order("start_at", { ascending: true });

      if (error) throw error;
      console.log("📅 Événements récupérés:", data?.length, "pour school_id:", schoolId);
      setEvents((data as unknown as Event[]) || []);
    } catch (error: any) {
      console.error("❌ Erreur chargement événements:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les événements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId]);

  const createEvent = async (eventData: Omit<Event, "id" | "created_at" | "updated_at">) => {
    try {
      const { error } = await supabase.from("events" as any).insert(eventData);
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Événement créé avec succès",
      });
      fetchEvents();
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      const { error } = await supabase
        .from("events" as any)
        .update(eventData)
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Événement mis à jour",
      });
      fetchEvents();
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("events" as any).delete().eq("id", id);
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Événement supprimé",
      });
      fetchEvents();
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};
