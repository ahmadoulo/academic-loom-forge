import { useState } from 'react';
import { TrendingUp, AlertTriangle, Calendar, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/hooks/useFinance';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface FinanceDashboardProps {
  schoolId: string;
}

export const FinanceDashboard = ({ schoolId }: FinanceDashboardProps) => {
  const { schoolFees, loading, getFinancialSummary, generateMonthlyFees } = useFinance(schoolId);
  const [generatingMonth, setGeneratingMonth] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const summary = getFinancialSummary();

  // Get current month for generation
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Get overdue fees (pending status)
  const overdueFees = schoolFees.filter(fee => fee.status === 'pending');

  const handleGenerateFees = async () => {
    if (!generatingMonth) {
      toast.error('Veuillez sélectionner un mois');
      return;
    }

    setIsGenerating(true);
    try {
      await generateMonthlyFees(generatingMonth);
      setGeneratingMonth('');
    } catch (error) {
      console.error('Error generating fees:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      pending: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Payé',
      partial: 'Partiel',
      pending: 'Non payé'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Encaissé</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.totalPaid.toFixed(2)} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tous les paiements reçus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Dû</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalDue.toFixed(2)} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Montant total à percevoir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reste à Percevoir</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.totalRemaining.toFixed(2)} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Montant en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Impayés</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.pendingCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Frais en attente de paiement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Fees Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Générer les Frais Mensuels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium mb-2 block">
                Sélectionner le mois
              </label>
              <Input
                type="month"
                value={generatingMonth}
                onChange={(e) => setGeneratingMonth(e.target.value)}
                max={new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 7)}
              />
            </div>
            <Button
              onClick={handleGenerateFees}
              disabled={!generatingMonth || isGenerating}
            >
              {isGenerating ? 'Génération...' : 'Générer les frais'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Cette action créera automatiquement les frais mensuels pour tous les élèves actifs
            selon les types de frais configurés.
          </p>
        </CardContent>
      </Card>

      {/* Overdue Fees List */}
      <Card>
        <CardHeader>
          <CardTitle>Frais en Retard ({overdueFees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : overdueFees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun frais en retard
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>CIN</TableHead>
                  <TableHead>Type de Frais</TableHead>
                  <TableHead>Mois</TableHead>
                  <TableHead>Montant Dû</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueFees.slice(0, 10).map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">
                      {fee.students?.firstname} {fee.students?.lastname}
                    </TableCell>
                    <TableCell>{fee.students?.cin_number}</TableCell>
                    <TableCell>{fee.school_fee_config?.name}</TableCell>
                    <TableCell>{fee.due_month}</TableCell>
                    <TableCell className="font-semibold">
                      {Number(fee.amount_due).toFixed(2)} MAD
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(fee.status)}>
                        {getStatusLabel(fee.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {overdueFees.length > 10 && (
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Et {overdueFees.length - 10} autres frais en retard...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
