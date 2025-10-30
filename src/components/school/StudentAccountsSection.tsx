import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Users, Clock } from "lucide-react";
import { useStudentAccounts } from "@/hooks/useStudentAccounts";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface StudentAccountsSectionProps {
  schoolId: string;
}

export const StudentAccountsSection = ({ schoolId }: StudentAccountsSectionProps) => {
  const { accounts, loading, sendInvitation, fetchAccountsByYear } = useStudentAccounts(schoolId);
  const { currentYear, availableYears } = useAcademicYear();
  const [activeTab, setActiveTab] = useState<"current" | "previous">("current");
  const [previousYearAccounts, setPreviousYearAccounts] = useState<any[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  // Charger les comptes des années précédentes quand on change d'onglet
  useEffect(() => {
    const loadPreviousYears = async () => {
      if (activeTab === "previous") {
        setLoadingPrevious(true);
        const previousYears = availableYears.filter(y => y.id !== currentYear?.id);
        
        // Récupérer tous les comptes des années précédentes
        const allPreviousAccounts: any[] = [];
        for (const year of previousYears) {
          const yearAccounts = await fetchAccountsByYear(year.id);
          if (yearAccounts) {
            allPreviousAccounts.push(...yearAccounts);
          }
        }
        
        // Dédupliquer par student_id
        const uniqueAccounts = Array.from(
          new Map(allPreviousAccounts.map(acc => [acc.student_id, acc])).values()
        );
        
        setPreviousYearAccounts(uniqueAccounts);
        setLoadingPrevious(false);
      }
    };

    loadPreviousYears();
  }, [activeTab, currentYear, availableYears]);

  const renderAccountsTable = (accountsList: any[], isLoading: boolean) => (
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
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                Chargement...
              </TableCell>
            </TableRow>
          ) : accountsList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Aucun étudiant trouvé
              </TableCell>
            </TableRow>
          ) : (
            accountsList.map((account) => (
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
  );

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
            {renderAccountsTable(previousYearAccounts, loadingPrevious)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
