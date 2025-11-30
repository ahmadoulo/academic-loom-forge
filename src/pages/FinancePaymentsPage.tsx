import { PaymentManagement } from '@/components/school/finance/PaymentManagement';

interface FinancePaymentsPageProps {
  schoolId: string;
}

export const FinancePaymentsPage = ({ schoolId }: FinancePaymentsPageProps) => {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion des Paiements</h1>
        <p className="text-muted-foreground mt-2">
          Enregistrez les paiements et suivez les frais des élèves
        </p>
      </div>

      <PaymentManagement schoolId={schoolId} />
    </div>
  );
};
