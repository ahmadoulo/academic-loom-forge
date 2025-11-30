import { FeeConfigManagement } from '@/components/school/finance/FeeConfigManagement';

interface FinanceConfigPageProps {
  schoolId: string;
}

export const FinanceConfigPage = ({ schoolId }: FinanceConfigPageProps) => {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuration des Frais</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les types de frais scolaires (scolarité, transport, etc.)
        </p>
      </div>

      <FeeConfigManagement schoolId={schoolId} />
    </div>
  );
};
