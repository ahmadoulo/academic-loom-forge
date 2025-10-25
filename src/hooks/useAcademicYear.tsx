import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SchoolYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

interface AcademicYearContextType {
  currentYear: SchoolYear | null;
  selectedYear: SchoolYear | null;
  setSelectedYear: (year: SchoolYear | null) => void;
  availableYears: SchoolYear[];
  loading: boolean;
  refetch: () => Promise<void>;
  getYearForCreation: () => string | null;
  getYearForDisplay: () => string | null;
  setCurrentYear: (yearId: string) => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const AcademicYearProvider = ({ children }: { children: ReactNode }) => {
  const [currentYear, setCurrentYearState] = useState<SchoolYear | null>(null);
  const [selectedYear, setSelectedYear] = useState<SchoolYear | null>(null);
  const [availableYears, setAvailableYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchYears = async () => {
    try {
      const { data, error } = await supabase
        .from('school_years' as any)
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;

      if (data) {
        setAvailableYears(data as unknown as SchoolYear[]);
        const current = (data as unknown as SchoolYear[]).find(y => y.is_current);
        if (current) {
          setCurrentYearState(current);
          // Par défaut, afficher l'année courante
          setSelectedYear(current);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des années scolaires:', error);
      toast.error('Erreur lors du chargement des années scolaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  // Pour créer des données, toujours utiliser l'année courante
  const getYearForCreation = () => currentYear?.id || null;

  // Pour afficher des données, utiliser l'année sélectionnée (ou "all" pour tout)
  const getYearForDisplay = () => {
    if (selectedYear?.id === 'all') return null;
    return selectedYear?.id || currentYear?.id || null;
  };

  // Fonction pour changer l'année courante (admin uniquement)
  const setCurrentYear = async (yearId: string) => {
    try {
      const { error } = await supabase.rpc('set_current_school_year' as any, {
        year_id: yearId
      });

      if (error) throw error;

      toast.success('Année scolaire active mise à jour');
      await fetchYears();
    } catch (error) {
      console.error('Erreur lors du changement d\'année courante:', error);
      toast.error('Erreur lors du changement d\'année courante');
    }
  };

  return (
    <AcademicYearContext.Provider
      value={{
        currentYear,
        selectedYear,
        setSelectedYear,
        availableYears,
        loading,
        refetch: fetchYears,
        getYearForCreation,
        getYearForDisplay,
        setCurrentYear,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error('useAcademicYear must be used within AcademicYearProvider');
  }
  return context;
};
