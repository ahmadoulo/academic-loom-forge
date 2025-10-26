import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SchoolYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_next?: boolean;
  school_id: string;
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
      let schoolId = null;

      // Essayer d'abord de récupérer depuis customAuthUser (système custom)
      const customUser = localStorage.getItem('customAuthUser');
      console.log('DEBUG AcademicYear: customAuthUser raw:', customUser);
      
      if (customUser) {
        const userData = JSON.parse(customUser);
        schoolId = userData.school_id;
        console.log('DEBUG AcademicYear: School ID from custom auth:', schoolId);
        console.log('DEBUG AcademicYear: Full custom user data:', userData);
      }

      // Si pas de custom auth, essayer Supabase auth
      if (!schoolId) {
        console.log('DEBUG AcademicYear: No custom auth, trying Supabase...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('DEBUG AcademicYear: Supabase user:', user);
        
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles' as any)
            .select('school_id')
            .eq('user_id', user.id)
            .maybeSingle();

          const profile = profileData as any;
          schoolId = profile?.school_id;
          console.log('DEBUG AcademicYear: School ID from Supabase:', schoolId);
        }
      }

      // Si toujours pas de school_id, ne pas continuer
      if (!schoolId) {
        console.log('DEBUG AcademicYear: No school_id found - stopping');
        setLoading(false);
        return;
      }

      console.log('DEBUG AcademicYear: Fetching years for school:', schoolId);
      const { data, error } = await supabase
        .from('school_years' as any)
        .select('*')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: true });
      
      console.log('DEBUG AcademicYear: Fetched years:', data, 'error:', error);

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
      let schoolId = null;

      // Essayer d'abord de récupérer depuis customAuthUser (système custom)
      const customUser = localStorage.getItem('customAuthUser');
      if (customUser) {
        const userData = JSON.parse(customUser);
        schoolId = userData.school_id;
      }

      // Si pas de custom auth, essayer Supabase auth
      if (!schoolId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles' as any)
            .select('school_id')
            .eq('user_id', user.id)
            .maybeSingle();

          const profile = profileData as any;
          schoolId = profile?.school_id;
        }
      }

      if (!schoolId) throw new Error('School not found');

      const { error } = await supabase.rpc('set_current_school_year' as any, {
        year_id: yearId,
        p_school_id: schoolId
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
