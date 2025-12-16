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

export const BULLETIN_TEMPLATES: { id: BulletinTemplate; name: string; description: string; icon: string }[] = [
  {
    id: 'classic',
    name: 'Classique',
    description: 'Double bordure, en-têtes colorés, boîtes informatives',
    icon: '📋'
  },
  {
    id: 'modern',
    name: 'Moderne',
    description: 'Bandeau dégradé, cartes arrondies, pilules colorées',
    icon: '✨'
  },
  {
    id: 'minimal',
    name: 'Minimaliste',
    description: 'Ultra épuré, lignes fines, beaucoup d\'espace blanc',
    icon: '◻️'
  },
  {
    id: 'elegant',
    name: 'Élégant',
    description: 'Coins décoratifs, encadrés raffinés, triangles accent',
    icon: '👑'
  }
];

export const PRESET_COLORS = [
  { name: 'Marine Classique', primary: '#1a365d', secondary: '#4a5568', accent: '#c53030' },
  { name: 'Indigo Moderne', primary: '#6366f1', secondary: '#818cf8', accent: '#8b5cf6' },
  { name: 'Ardoise Minimale', primary: '#18181b', secondary: '#71717a', accent: '#3f3f46' },
  { name: 'Violet Élégant', primary: '#7c3aed', secondary: '#a78bfa', accent: '#c084fc' },
  { name: 'Émeraude', primary: '#047857', secondary: '#34d399', accent: '#10b981' },
  { name: 'Bordeaux', primary: '#9f1239', secondary: '#fb7185', accent: '#e11d48' },
  { name: 'Ocean', primary: '#0369a1', secondary: '#38bdf8', accent: '#0ea5e9' },
  { name: 'Ambre', primary: '#b45309', secondary: '#fbbf24', accent: '#f59e0b' },
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
