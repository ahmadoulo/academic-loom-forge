import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook qui appelle automatiquement l'Edge Function pour envoyer les notifications d'absence
 * Fonctionne en arrière-plan tant que le dashboard est ouvert
 */
export function useAutoAbsenceNotifications() {
  useEffect(() => {
    let isActive = true;

    const checkAndSendNotifications = async () => {
      if (!isActive) return;

      try {
        await supabase.functions.invoke('auto-send-absence-notifications', {
          body: {}
        });
      } catch (error) {
        // Silent error handling in production
      }
    };

    // Vérifier toutes les minutes
    const interval = setInterval(checkAndSendNotifications, 60000);
    
    // Première vérification immédiate
    checkAndSendNotifications();

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);
}
