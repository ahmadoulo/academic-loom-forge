import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  visibility: string;
  class_id: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export const useAnnouncements = (schoolId?: string) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnnouncements = async () => {
    try {
      let query = supabase
        .from("announcements" as any)
        .select("*");
      
      // Filtrer par school_id si fourni
      if (schoolId) {
        console.log("🔍 Filtrage des annonces par school_id:", schoolId);
        query = query.eq("school_id", schoolId);
      } else {
        console.log("⚠️ Aucun school_id fourni, toutes les annonces seront affichées");
      }
      
      const { data, error } = await query
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("📢 Annonces récupérées:", data?.length, "pour school_id:", schoolId);
      setAnnouncements((data as unknown as Announcement[]) || []);
    } catch (error: any) {
      console.error("❌ Erreur chargement annonces:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les annonces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel("announcements-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId]);

  const createAnnouncement = async (announcementData: Omit<Announcement, "id" | "created_at" | "updated_at">) => {
    try {
      const { error } = await supabase.from("announcements" as any).insert(announcementData);
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Annonce créée avec succès",
      });
      fetchAnnouncements();
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

  const updateAnnouncement = async (id: string, announcementData: Partial<Announcement>) => {
    try {
      const { error } = await supabase
        .from("announcements" as any)
        .update(announcementData)
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Annonce mise à jour",
      });
      fetchAnnouncements();
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

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase.from("announcements" as any).delete().eq("id", id);
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Annonce supprimée",
      });
      fetchAnnouncements();
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
    announcements,
    loading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    refetch: fetchAnnouncements,
  };
};
