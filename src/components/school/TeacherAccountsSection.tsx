import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, GraduationCap, Loader2 } from "lucide-react";
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
          <GraduationCap className="h-5 w-5" />
          Comptes Professeurs
        </CardTitle>
        <CardDescription>
          Gérez les invitations des professeurs de votre école (1 professeur = 1 compte unique)
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
                    <TableCell>{account.email || 'Email non renseigné'}</TableCell>
                    <TableCell>{account.teacher?.qualification || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={account.is_active ? "default" : "secondary"}>
                        {account.is_active ? 'Actif' : 'En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.invitation_sent ? "outline" : "secondary"}>
                        {account.invitation_sent ? 'Envoyée' : 'Non envoyée'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {account.email && (
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
                          {account.is_active ? 'Renvoyer' : 'Envoyer'} invitation
                        </Button>
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
