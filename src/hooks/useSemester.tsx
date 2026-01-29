import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SchoolSemester } from './useSchoolSemesters';

interface SemesterContextType {
  currentSemester: SchoolSemester | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const SemesterContext = createContext<SemesterContextType | undefined>(undefined);

interface SemesterProviderProps {
  children: ReactNode;
  schoolId?: string;
}

export const SemesterProvider = ({ children, schoolId }: SemesterProviderProps) => {
  const [currentSemester, setCurrentSemester] = useState<SchoolSemester | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentSemester = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('school_semester' as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_actual', true)
        .maybeSingle();

      if (error) throw error;

      setCurrentSemester(data as unknown as SchoolSemester);
    } catch (err) {
      setCurrentSemester(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentSemester();
  }, [schoolId]);

  return (
    <SemesterContext.Provider value={{ currentSemester, loading, refetch: fetchCurrentSemester }}>
      {children}
    </SemesterContext.Provider>
  );
};

export const useSemester = () => {
  const context = useContext(SemesterContext);
  if (context === undefined) {
    throw new Error('useSemester must be used within a SemesterProvider');
  }
  return context;
};

// Hook optionnel qui retourne null si pas de provider
export const useOptionalSemester = () => {
  const context = useContext(SemesterContext);
  return context || null;
};
