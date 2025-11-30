import { FinanceDashboard } from '@/components/school/finance/FinanceDashboard';

interface FinanceDashboardPageProps {
  schoolId: string;
}

export const FinanceDashboardPage = ({ schoolId }: FinanceDashboardPageProps) => {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tableau de Bord Finance</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble des finances de l'école
        </p>
      </div>

      <FinanceDashboard schoolId={schoolId} />
    </div>
  );
};
