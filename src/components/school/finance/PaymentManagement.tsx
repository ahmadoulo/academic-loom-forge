import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFinance, SchoolFee } from '@/hooks/useFinance';
import { PaymentDialog } from './PaymentDialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaymentManagementProps {
  schoolId: string;
}

export const PaymentManagement = ({ schoolId }: PaymentManagementProps) => {
  const { schoolFees, loading, getFinancialSummary } = useFinance(schoolId);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<SchoolFee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const summary = getFinancialSummary();

  const handleRecordPayment = (fee: SchoolFee) => {
    setSelectedFee(fee);
    setPaymentDialogOpen(true);
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
      pending: 'En attente'
    };
    return labels[status] || status;
  };

  const uniqueMonths = useMemo(() => {
    const months = Array.from(new Set(schoolFees.map(f => f.due_month)));
    return months.sort().reverse();
  }, [schoolFees]);

  const filteredFees = useMemo(() => {
    return schoolFees.filter(fee => {
      const matchesSearch = searchTerm === '' || 
        fee.students?.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.students?.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.students?.cin_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;
      const matchesMonth = monthFilter === 'all' || fee.due_month === monthFilter;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [schoolFees, searchTerm, statusFilter, monthFilter]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Encaissé</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.totalPaid.toFixed(2)} MAD
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reste à Percevoir</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.totalRemaining.toFixed(2)} MAD
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Frais en Attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.pendingCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Rechercher par nom ou CIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="partial">Partiel</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {uniqueMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filteredFees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun frais trouvé
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
                  <TableHead>Montant Payé</TableHead>
                  <TableHead>Reste</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFees.map((fee) => {
                  const remaining = Number(fee.amount_due) - Number(fee.amount_paid);
                  return (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">
                        {fee.students?.firstname} {fee.students?.lastname}
                      </TableCell>
                      <TableCell>{fee.students?.cin_number}</TableCell>
                      <TableCell>{fee.school_fee_config?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {fee.due_month}
                        </div>
                      </TableCell>
                      <TableCell>{Number(fee.amount_due).toFixed(2)} MAD</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {Number(fee.amount_paid).toFixed(2)} MAD
                      </TableCell>
                      <TableCell className={remaining > 0 ? 'text-orange-600 font-medium' : ''}>
                        {remaining.toFixed(2)} MAD
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(fee.status)}>
                          {getStatusLabel(fee.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {fee.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => handleRecordPayment(fee)}
                          >
                            Encaisser
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        schoolId={schoolId}
        fee={selectedFee}
      />
    </div>
  );
};
