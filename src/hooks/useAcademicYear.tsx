import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface AcademicYearContextType {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: string[];
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

// Générer les années scolaires disponibles (3 ans passés, année courante, 1 an futur)
const generateAvailableYears = (): string[] => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  // Si on est entre septembre et décembre, l'année scolaire courante est currentYear-currentYear+1
  // Sinon c'est currentYear-1-currentYear
  const schoolYearStart = currentMonth >= 8 ? currentYear : currentYear - 1;
  
  const years: string[] = [];
  // 3 années passées + année courante + 1 année future
  for (let i = -3; i <= 1; i++) {
    const startYear = schoolYearStart + i;
    years.push(`${startYear}-${startYear + 1}`);
  }
  
  return years;
};

interface AcademicYearProviderProps {
  children: ReactNode;
}

export function AcademicYearProvider({ children }: AcademicYearProviderProps) {
  const availableYears = generateAvailableYears();
  const defaultYear = availableYears[3]; // Année courante (index 3 car on a 3 ans passés)
  
  const [selectedYear, setSelectedYearState] = useState<string>(() => {
    // Récupérer l'année depuis localStorage ou utiliser l'année courante
    const stored = localStorage.getItem('selectedAcademicYear');
    return stored && availableYears.includes(stored) ? stored : defaultYear;
  });

  const setSelectedYear = (year: string) => {
    setSelectedYearState(year);
    localStorage.setItem('selectedAcademicYear', year);
  };

  useEffect(() => {
    // Mettre à jour localStorage si l'année change
    localStorage.setItem('selectedAcademicYear', selectedYear);
  }, [selectedYear]);

  return (
    <AcademicYearContext.Provider value={{ selectedYear, setSelectedYear, availableYears }}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
}
