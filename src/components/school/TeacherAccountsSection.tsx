import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Users, Loader2, CheckCircle2, Clock } from "lucide-react";
import { useTeacherAccounts } from "@/hooks/useTeacherAccounts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface TeacherAccountsSectionProps {
  schoolId: string;
}

export const TeacherAccountsSection = ({ schoolId }: TeacherAccountsSectionProps) => {
  const { accounts, loading, sendInvitation } = useTeacherAccounts(schoolId);
  const [sendingInvitation, setSendingInvitation] = useState<string | null>(null);

  const handleSendInvitation = async (teacherId: string, email: string) => {
    if (!email) return;
    setSendingInvitation(teacherId);
    try {
      await sendInvitation(teacherId, email);
    } finally {
      setSendingInvitation(null);
    }
  };

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
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Invitation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement...
                    </div>
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun professeur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.teacher_id}>
                    <TableCell className="font-medium">
                      {account.teacher?.firstname} {account.teacher?.lastname}
                    </TableCell>
                    <TableCell>{account.email || <span className="text-muted-foreground italic">Non renseigné</span>}</TableCell>
                    <TableCell>{account.teacher?.qualification || <span className="text-muted-foreground">N/A</span>}</TableCell>
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
                    <TableCell>
                      <Badge variant={account.invitation_sent ? "outline" : "secondary"}>
                        {account.invitation_sent ? 'Envoyée' : 'Non envoyée'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {account.email ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendInvitation(account.teacher_id, account.email)}
                          disabled={sendingInvitation === account.teacher_id || account.is_active}
                        >
                          {sendingInvitation === account.teacher_id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4 mr-2" />
                          )}
                          {account.is_active ? 'Compte actif' : account.invitation_sent ? 'Renvoyer' : 'Envoyer invitation'}
                        </Button>
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
