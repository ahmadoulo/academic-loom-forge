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
        console.log('🔔 Vérification automatique des notifications d\'absence...');
        
        const { data, error } = await supabase.functions.invoke('auto-send-absence-notifications', {
          body: {}
        });

        if (error) {
          console.error('Erreur lors de la vérification des notifications:', error);
        } else if (data?.notificationsSent > 0) {
          console.log(`✅ ${data.notificationsSent} notification(s) d'absence envoyée(s) automatiquement`);
        }
      } catch (error) {
        console.error('Erreur lors de l\'appel de la fonction:', error);
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
