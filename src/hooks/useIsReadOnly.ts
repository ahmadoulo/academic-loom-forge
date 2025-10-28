import { useMemo } from 'react';
import { useAcademicYear } from './useAcademicYear';

/**
 * Hook pour déterminer si l'interface doit être en mode lecture seule
 * Retourne true si l'année sélectionnée n'est pas l'année courante
 */
export const useIsReadOnly = () => {
  const { currentYear, selectedYear } = useAcademicYear();

  const isReadOnly = useMemo(() => {
    // Si aucune année n'est sélectionnée ou si c'est "toutes les années", pas de mode lecture seule
    if (!selectedYear || selectedYear.id === 'all') {
      return false;
    }

    // Si pas d'année courante définie, pas de mode lecture seule
    if (!currentYear) {
      return false;
    }

    // Mode lecture seule si l'année sélectionnée n'est pas l'année courante
    return selectedYear.id !== currentYear.id;
  }, [currentYear, selectedYear]);

  return { 
    isReadOnly,
    isCurrentYear: selectedYear?.id === currentYear?.id,
    selectedYear,
    currentYear
  };
};
