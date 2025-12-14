import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BulletinSettings {
  id: string;
  school_id: string;
  show_weighted_average: boolean;
  show_ranking: boolean;
  show_mention: boolean;
  show_decision: boolean;
  show_observations: boolean;
  custom_footer_text: string | null;
}

const defaultSettings: Omit<BulletinSettings, 'id' | 'school_id'> = {
  show_weighted_average: true,
  show_ranking: true,
  show_mention: true,
  show_decision: true,
  show_observations: false,
  custom_footer_text: null,
};

export const useBulletinSettings = (schoolId: string) => {
  const [settings, setSettings] = useState<BulletinSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!schoolId) return;
    
    try {
      const { data, error } = await supabase
        .from('bulletin_settings')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings(data as BulletinSettings);
      } else {
        // Créer les paramètres par défaut si inexistants
        const { data: newSettings, error: insertError } = await supabase
          .from('bulletin_settings')
          .insert({ school_id: schoolId, ...defaultSettings })
          .select()
          .single();
        
        if (insertError) throw insertError;
        setSettings(newSettings as BulletinSettings);
      }
    } catch (error) {
      console.error("Erreur chargement paramètres bulletin:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Omit<BulletinSettings, 'id' | 'school_id'>>) => {
    if (!settings) return false;
    
    try {
      const { error } = await supabase
        .from('bulletin_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', settings.id);

      if (error) throw error;
      
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error("Erreur mise à jour paramètres:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [schoolId]);

  return { settings, loading, updateSettings, refetch: fetchSettings };
};
