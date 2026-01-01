import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Users, Clock, Filter, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useStudentAccounts, StudentAccount } from "@/hooks/useStudentAccounts";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface StudentAccountsSectionProps {
  schoolId: string;
}

type StatusFilter = 'all' | 'active' | 'pending';

export const StudentAccountsSection = ({ schoolId }: StudentAccountsSectionProps) => {
  const { accounts, loading, sendInvitation, fetchAccountsByYear } = useStudentAccounts(schoolId);
  const { currentYear, availableYears } = useAcademicYear();
  const [activeTab, setActiveTab] = useState<"current" | "previous">("current");
  const [previousYearAccounts, setPreviousYearAccounts] = useState<StudentAccount[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sendingBulk, setSendingBulk] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Charger les comptes des années précédentes quand on change d'onglet
  useEffect(() => {
    const loadPreviousYears = async () => {
      if (activeTab === "previous") {
        setLoadingPrevious(true);
        const previousYears = availableYears.filter(y => y.id !== currentYear?.id);
        
        const allPreviousAccounts: StudentAccount[] = [];
        for (const year of previousYears) {
          const yearAccounts = await fetchAccountsByYear(year.id);
          if (yearAccounts) {
            allPreviousAccounts.push(...yearAccounts);
          }
        }
        
        const uniqueAccounts = Array.from(
          new Map(allPreviousAccounts.map(acc => [acc.student_id, acc])).values()
        );
        
        setPreviousYearAccounts(uniqueAccounts);
        setLoadingPrevious(false);
      }
    };

    loadPreviousYears();
  }, [activeTab, currentYear, availableYears]);

  const filterAccounts = (accountsList: StudentAccount[]) => {
    return accountsList.filter(account => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return account.is_active;
      if (statusFilter === 'pending') return !account.is_active;
      return true;
    });
  };

  const getPendingAccounts = (accountsList: StudentAccount[]) => {
    return accountsList.filter(acc => !acc.is_active && acc.email);
  };

  const handleSendInvitation = async (studentId: string, email: string) => {
    setSendingId(studentId);
    try {
      await sendInvitation(studentId, email);
    } finally {
      setSendingId(null);
    }
  };

  const handleBulkSendInvitations = async (accountsList: StudentAccount[]) => {
    const pendingAccounts = getPendingAccounts(accountsList);
    if (pendingAccounts.length === 0) {
      toast.info("Aucun compte en attente avec email à inviter");
      return;
    }

    setSendingBulk(true);
    let successCount = 0;
    let errorCount = 0;

    for (const account of pendingAccounts) {
      try {
        await sendInvitation(account.student_id, account.email);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setSendingBulk(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} invitation(s) envoyée(s) avec succès`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} invitation(s) en échec`);
    }
  };

  const renderAccountsTable = (accountsList: StudentAccount[], isLoading: boolean, showBulkActions: boolean = true) => {
    const filteredAccounts = filterAccounts(accountsList);
    const pendingCount = getPendingAccounts(accountsList).length;

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showBulkActions && pendingCount > 0 && (
            <Button
              onClick={() => handleBulkSendInvitations(accountsList)}
              disabled={sendingBulk}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {sendingBulk ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer invitations en masse ({pendingCount})
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Classe</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun étudiant trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.student_id}>
                    <TableCell>
                      <div className="font-medium">
                        {account.student?.firstname} {account.student?.lastname}
                      </div>
                      <div className="text-sm text-muted-foreground sm:hidden">
                        {account.email || 'Email non renseigné'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {account.email || <span className="text-muted-foreground italic">Non renseigné</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {account.student?.classes?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {account.is_active ? (
                        <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!account.is_active && account.email ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendInvitation(account.student_id, account.email)}
                          disabled={sendingId === account.student_id}
                        >
                          {sendingId === account.student_id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4 mr-2" />
                          )}
                          <span className="hidden sm:inline">
                            {account.invitation_sent ? 'Renvoyer' : 'Envoyer'}
                          </span>
                        </Button>
                      ) : account.is_active ? (
                        <span className="text-xs text-muted-foreground">Compte actif</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Email requis</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Comptes Étudiants
        </CardTitle>
        <CardDescription>
          Gérez les invitations des étudiants de votre école (1 étudiant = 1 compte unique)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "current" | "previous")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Année en cours
            </TabsTrigger>
            <TabsTrigger value="previous" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Années précédentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Comptes étudiants de l'année scolaire <span className="font-semibold">{currentYear?.name}</span>
            </div>
            {renderAccountsTable(accounts, loading)}
          </TabsContent>

          <TabsContent value="previous" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Historique des comptes étudiants des années précédentes (consultation seule)
            </div>
            {renderAccountsTable(previousYearAccounts, loadingPrevious, false)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};