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
  template_style: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

export type BulletinTemplate = 'classic' | 'modern' | 'minimal' | 'elegant';

export const BULLETIN_TEMPLATES: { id: BulletinTemplate; name: string; description: string; preview: string }[] = [
  {
    id: 'classic',
    name: 'Classique',
    description: 'Style traditionnel avec en-têtes gris',
    preview: 'Bordures nettes, fond gris clair'
  },
  {
    id: 'modern',
    name: 'Moderne',
    description: 'Design épuré avec accents colorés',
    preview: 'Lignes fines, couleurs vives'
  },
  {
    id: 'minimal',
    name: 'Minimaliste',
    description: 'Simple et efficace',
    preview: 'Peu de bordures, espacement généreux'
  },
  {
    id: 'elegant',
    name: 'Élégant',
    description: 'Style professionnel raffiné',
    preview: 'Dégradés subtils, typographie soignée'
  }
];

export const PRESET_COLORS = [
  { name: 'Gris Classique', primary: '#333333', secondary: '#666666', accent: '#0066cc' },
  { name: 'Bleu Professionnel', primary: '#1e3a5f', secondary: '#4a6fa5', accent: '#2980b9' },
  { name: 'Vert Académique', primary: '#1b4332', secondary: '#40916c', accent: '#52b788' },
  { name: 'Bordeaux Élégant', primary: '#722f37', secondary: '#9b4a54', accent: '#c9184a' },
  { name: 'Violet Royal', primary: '#4a1a6b', secondary: '#7b4a9e', accent: '#9b59b6' },
  { name: 'Orange Dynamique', primary: '#bf4a00', secondary: '#e67e22', accent: '#f39c12' },
];

const defaultSettings: Omit<BulletinSettings, 'id' | 'school_id'> = {
  show_weighted_average: true,
  show_ranking: true,
  show_mention: true,
  show_decision: true,
  show_observations: false,
  custom_footer_text: null,
  template_style: 'classic',
  primary_color: '#333333',
  secondary_color: '#666666',
  accent_color: '#0066cc',
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
        setSettings({
          ...data,
          template_style: data.template_style || 'classic',
          primary_color: data.primary_color || '#333333',
          secondary_color: data.secondary_color || '#666666',
          accent_color: data.accent_color || '#0066cc',
        } as BulletinSettings);
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
