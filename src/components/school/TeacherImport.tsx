import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';

interface TeacherImportProps {
  onImportComplete: (teachers: any[]) => void;
  schoolId: string;
}

export const TeacherImport = ({ onImportComplete, schoolId }: TeacherImportProps) => {
  const { checkCanAddTeachers, loading: limitsLoading } = useSubscriptionLimits(schoolId);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({
        title: "Format non supporté",
        description: "Veuillez utiliser un fichier Excel (.xlsx, .xls) ou CSV",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("Le fichier est vide");
      }

      // Map the imported data to the expected format
      const teachers = jsonData.map((row: any, index: number) => {
        const firstName = row['Prénom'] || row['Prenom'] || row['firstname'] || row['FirstName'] || '';
        const lastName = row['Nom'] || row['lastname'] || row['LastName'] || '';
        const email = row['Email'] || row['email'] || '';
        const gender = row['Genre'] || row['gender'] || '';
        const mobile = row['Mobile'] || row['mobile'] || row['Téléphone'] || row['phone'] || '';
        const birthDate = row['Date de naissance'] || row['birth_date'] || row['DateNaissance'] || '';
        const qualification = row['Qualification'] || row['qualification'] || '';
        const address = row['Adresse'] || row['address'] || '';
        const salary = row['Salaire'] || row['salary'] || '';
        const joinDate = row["Date d'adhésion"] || row['join_date'] || row['DateAdhesion'] || '';
        const status = row['Statut'] || row['status'] || 'active';

        if (!firstName || !lastName) {
          throw new Error(`Ligne ${index + 2}: Prénom et nom requis`);
        }

        return {
          firstname: firstName.toString().trim(),
          lastname: lastName.toString().trim(),
          email: email ? email.toString().trim() : undefined,
          gender: gender ? (gender.toString().toLowerCase() === 'masculin' || gender.toString().toLowerCase() === 'male' ? 'male' : 'female') : undefined,
          mobile: mobile ? mobile.toString().trim() : undefined,
          birth_date: birthDate ? birthDate.toString().trim() : undefined,
          qualification: qualification ? qualification.toString().trim() : undefined,
          address: address ? address.toString().trim() : undefined,
          salary: salary ? parseFloat(salary.toString()) : undefined,
          join_date: joinDate ? joinDate.toString().trim() : undefined,
          status: status.toString().toLowerCase() === 'actif' || status.toString().toLowerCase() === 'active' ? 'active' : 'inactive',
        };
      });

      // Check if we can add this many teachers
      if (!checkCanAddTeachers(teachers.length)) {
        toast({
          title: "Limite atteinte",
          description: "Limite professeur atteint. Contactez le support",
          variant: "destructive"
        });
        return;
      }

      onImportComplete(teachers);
      
      toast({
        title: "Import réussi",
        description: `${teachers.length} professeurs importés avec succès`,
      });
    } catch (error) {
      console.error('Error importing file:', error);
      toast({
        title: "Erreur d'import",
        description: error instanceof Error ? error.message : "Erreur lors de la lecture du fichier",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      { 
        Prénom: "Jean", 
        Nom: "Dupont", 
        Email: "jean.dupont@email.com",
        Genre: "Masculin",
        Mobile: "+212612345678",
        "Date de naissance": "1985-05-15",
        Qualification: "Docteur en informatique",
        Adresse: "123 Rue Example, Casablanca",
        Salaire: "8000",
        "Date d'adhésion": "2020-09-01",
        Statut: "Actif"
      },
      { 
        Prénom: "Marie", 
        Nom: "Martin", 
        Email: "marie.martin@email.com",
        Genre: "Féminin",
        Mobile: "+212698765432",
        "Date de naissance": "1990-03-20",
        Qualification: "Master en mathématiques",
        Adresse: "456 Avenue Example, Rabat",
        Salaire: "7500",
        "Date d'adhésion": "2021-01-15",
        Statut: "Actif"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Professeurs");
    
    XLSX.writeFile(wb, 'template_professeurs.xlsx');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import de Professeurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!limitsLoading && !checkCanAddTeachers(1) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Limite professeur atteint. Contactez le support pour augmenter votre capacité.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger le modèle
          </Button>
        </div>
        
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${importing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
          />
          
          {importing ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Import en cours...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">
                Cliquez ou glissez-déposez votre fichier ici
              </p>
              <p className="text-xs text-muted-foreground">
                Formats supportés: Excel (.xlsx, .xls) ou CSV
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Colonnes attendues: Prénom, Nom, Email, Genre, Mobile, Date de naissance, Qualification, Adresse, Salaire, Date d'adhésion, Statut</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>Les doublons seront automatiquement ignorés</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
