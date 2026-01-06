import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Users, Loader2, CheckCircle2, Clock, Filter, Send } from "lucide-react";
import { useTeacherAccounts, TeacherAccount } from "@/hooks/useTeacherAccounts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

interface TeacherAccountsSectionProps {
  schoolId: string;
  canEdit?: boolean;
}

type StatusFilter = 'all' | 'active' | 'pending';

export const TeacherAccountsSection = ({ schoolId, canEdit = true }: TeacherAccountsSectionProps) => {
  const { accounts, loading, sendInvitation } = useTeacherAccounts(schoolId);
  const [sendingInvitation, setSendingInvitation] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sendingBulk, setSendingBulk] = useState(false);

  const handleSendInvitation = async (teacherId: string, email: string) => {
    if (!email) return;
    setSendingInvitation(teacherId);
    try {
      await sendInvitation(teacherId, email);
    } finally {
      setSendingInvitation(null);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return account.is_active;
    if (statusFilter === 'pending') return !account.is_active;
    return true;
  });

  const getPendingAccounts = () => {
    return accounts.filter(acc => !acc.is_active && acc.email);
  };

  const handleBulkSendInvitations = async () => {
    const pendingAccounts = getPendingAccounts();
    if (pendingAccounts.length === 0) {
      toast.info("Aucun compte en attente avec email à inviter");
      return;
    }

    setSendingBulk(true);
    let successCount = 0;
    let errorCount = 0;

    for (const account of pendingAccounts) {
      try {
        await sendInvitation(account.teacher_id, account.email);
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

  const pendingCount = getPendingAccounts().length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Comptes Professeurs
        </CardTitle>
        <CardDescription>
          Gérez les comptes des professeurs de votre école (1 professeur = 1 compte unique)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

          {canEdit && pendingCount > 0 && (
            <Button
              onClick={handleBulkSendInvitations}
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
                <TableHead className="hidden md:table-cell">Qualification</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
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
                    Aucun professeur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.teacher_id}>
                    <TableCell>
                      <div className="font-medium">
                        {account.teacher?.firstname} {account.teacher?.lastname}
                      </div>
                      <div className="text-sm text-muted-foreground sm:hidden">
                        {account.email || 'Email non renseigné'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {account.email || <span className="text-muted-foreground italic">Non renseigné</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {account.teacher?.qualification || <span className="text-muted-foreground">N/A</span>}
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
                      {canEdit && !account.is_active && account.email ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendInvitation(account.teacher_id, account.email)}
                          disabled={sendingInvitation === account.teacher_id}
                        >
                          {sendingInvitation === account.teacher_id ? (
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
                      ) : !canEdit ? (
                        <span className="text-xs text-muted-foreground">-</span>
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
      </CardContent>
    </Card>
  );
};