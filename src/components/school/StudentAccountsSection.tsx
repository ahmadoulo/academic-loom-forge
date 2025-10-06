import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Users } from "lucide-react";
import { useStudentAccounts } from "@/hooks/useStudentAccounts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface StudentAccountsSectionProps {
  schoolId: string;
}

export const StudentAccountsSection = ({ schoolId }: StudentAccountsSectionProps) => {
  const { accounts, loading, sendInvitation } = useStudentAccounts(schoolId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Comptes Étudiants
        </CardTitle>
        <CardDescription>
          Gérez les invitations des étudiants de votre école
        </CardDescription>
      </CardHeader>
      <CardContent>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Invitation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun étudiant trouvé. Ajoutez des étudiants dans la section "Étudiants".
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.student_id}>
                    <TableCell className="font-medium">
                      {account.student?.firstname} {account.student?.lastname}
                    </TableCell>
                    <TableCell>{account.email || 'Email non renseigné'}</TableCell>
                    <TableCell>{account.student?.classes?.name || 'N/A'}</TableCell>
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
                          onClick={() => sendInvitation(account.student_id, account.email)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
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
