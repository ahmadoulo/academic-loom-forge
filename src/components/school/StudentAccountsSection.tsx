import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Mail, Trash2, Download, FileSpreadsheet } from "lucide-react";
import { useStudentAccounts } from "@/hooks/useStudentAccounts";
import { useClasses } from "@/hooks/useClasses";
import { useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';

interface StudentAccountsSectionProps {
  schoolId: string;
}

export const StudentAccountsSection = ({ schoolId }: StudentAccountsSectionProps) => {
  const { accounts, loading, importStudentsFromExcel, sendInvitation, deleteAccount } = useStudentAccounts(schoolId);
  const { classes } = useClasses(schoolId);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      return;
    }

    setImporting(true);
    try {
      await importStudentsFromExcel(file, classes);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Prénom': 'Jean',
        'Nom': 'Dupont',
        'Email': 'jean.dupont@example.com',
        'Classe': classes[0]?.name || '6ème A'
      },
      {
        'Prénom': 'Marie',
        'Nom': 'Martin',
        'Email': 'marie.martin@example.com',
        'Classe': classes[0]?.name || '6ème A'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Étudiants');
    XLSX.writeFile(wb, 'template_etudiants.xlsx');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Comptes Étudiants
            </CardTitle>
            <CardDescription>
              Importez les étudiants depuis un fichier Excel et gérez leurs invitations
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger le modèle
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Import en cours...' : 'Importer Excel'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun compte étudiant. Importez un fichier Excel pour commencer.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.student?.firstname} {account.student?.lastname}
                    </TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.student?.classes?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={account.is_active ? "default" : "secondary"}>
                        {account.is_active ? 'Actif' : 'En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {!account.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendInvitation(account.id)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
                              deleteAccount(account.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
