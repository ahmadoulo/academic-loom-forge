import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface SchoolYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_next?: boolean;
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

// Detect context from current URL path to make selections independent per interface
const getContextFromPath = (): string => {
  const path = window.location.pathname;
  if (path.includes('/admin')) return 'admin';
  if (path.includes('/teacher')) return 'teacher';
  if (path.includes('/student')) return 'student';
  if (path.includes('/school')) return 'school';
  return 'default';
};

export const AcademicYearProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentYear, setCurrentYearState] = useState<SchoolYear | null>(null);
  const [selectedYear, setSelectedYearState] = useState<SchoolYear | null>(null);
  const [availableYears, setAvailableYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Clé localStorage unique par utilisateur ET par page/contexte
  const getStorageKey = () => {
    const context = getContextFromPath();
    if (!user) return `selectedAcademicYearId_guest_${context}`;
    const uniqueId = user.email || user.id || 'unknown';
    return `selectedAcademicYearId_${uniqueId}_${context}`;
  };

  const fetchYears = async () => {
    try {
      const { data, error } = await supabase
        .from('school_years' as any)
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;

      if (data) {
        // Filtrer les années qui ont des données
        const yearsWithData = await Promise.all(
          (data as unknown as SchoolYear[]).map(async (year) => {
            // Vérifier si l'année a des données (students, classes, ou assignments)
            const [studentsCount, classesCount, assignmentsCount] = await Promise.all([
              supabase
                .from('student_school' as any)
                .select('id', { count: 'exact', head: true })
                .eq('school_year_id', year.id),
              supabase
                .from('classes' as any)
                .select('id', { count: 'exact', head: true })
                .eq('school_year_id', year.id),
              supabase
                .from('assignments' as any)
                .select('id', { count: 'exact', head: true })
                .eq('school_year_id', year.id),
            ]);

            const hasData = 
              (studentsCount.count && studentsCount.count > 0) ||
              (classesCount.count && classesCount.count > 0) ||
              (assignmentsCount.count && assignmentsCount.count > 0) ||
              year.is_current; // Toujours inclure l'année courante

            return hasData ? year : null;
          })
        );

        // Inclure aussi l'année suivante (is_next) même sans données
        const allYears = (data as unknown as SchoolYear[]).filter(y => 
          y.is_current || 
          y.is_next || 
          yearsWithData.some(yd => yd?.id === y.id)
        );
        
        setAvailableYears(allYears);
        
        const current = allYears.find(y => y.is_current);
        if (current) {
          setCurrentYearState(current);
          
          // Restaurer l'année sélectionnée depuis localStorage si elle existe (unique par utilisateur)
          const storageKey = getStorageKey();
          const savedYearId = localStorage.getItem(storageKey);
          if (savedYearId) {
            const savedYear = allYears.find(y => y.id === savedYearId);
            if (savedYear) {
              setSelectedYearState(savedYear);
            } else {
              // Si l'année sauvegardée n'existe plus, nettoyer localStorage et utiliser current
              localStorage.removeItem(storageKey);
              setSelectedYearState(current);
            }
          } else {
            // Par défaut, afficher l'année courante
            setSelectedYearState(current);
          }
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
  }, [user?.email, user?.id]); // Re-fetch quand l'utilisateur change

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

  // Fonction wrapper pour setSelectedYear avec localStorage (unique par utilisateur et contexte)
  const setSelectedYear = (year: SchoolYear | null) => {
    setSelectedYearState(year);
    const storageKey = getStorageKey();
    if (year) {
      localStorage.setItem(storageKey, year.id);
    } else {
      localStorage.removeItem(storageKey);
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
