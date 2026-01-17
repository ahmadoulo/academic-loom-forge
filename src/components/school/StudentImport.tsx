import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface StudentImportProps {
  onImportComplete: (students: any[]) => void;
  classes: { id: string; name: string; }[];
}

export const StudentImport = ({ onImportComplete, classes }: StudentImportProps) => {
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
      const students = jsonData.map((row: any, index: number) => {
        const firstName = row['Prénom'] || row['Prenom'] || row['firstname'] || row['FirstName'] || '';
        const lastName = row['Nom'] || row['lastname'] || row['LastName'] || '';
        const className = row['Classe'] || row['classe'] || row['class'] || row['Class'] || '';
        const email = row['Email'] || row['email'] || '';
        const birthDate = row['Date de naissance'] || row['birth_date'] || row['DateNaissance'] || '';
        const cinNumber = row['CIN'] || row['cin'] || row['cin_number'] || '';
        const studentPhone = row['Téléphone étudiant'] || row['student_phone'] || row['TelEtudiant'] || '';
        const parentPhone = row['Téléphone parent'] || row['parent_phone'] || row['TelParent'] || '';

        if (!firstName || !lastName) {
          throw new Error(`Ligne ${index + 2}: Prénom et nom requis`);
        }

        // Find matching class
        const matchingClass = classes.find(cls => 
          cls.name.toLowerCase().includes(className.toLowerCase()) || 
          className.toLowerCase().includes(cls.name.toLowerCase())
        );

        // Class not found - silent handling

        return {
          firstname: firstName.toString().trim(),
          lastname: lastName.toString().trim(),
          email: email.toString().trim(),
          class_id: matchingClass?.id || classes[0]?.id || '', // Use first class as fallback
          class_name: className || matchingClass?.name || '',
          birth_date: birthDate ? birthDate.toString().trim() : undefined,
          cin_number: cinNumber ? cinNumber.toString().trim() : undefined,
          student_phone: studentPhone ? studentPhone.toString().trim() : undefined,
          parent_phone: parentPhone ? parentPhone.toString().trim() : undefined,
        };
      });

      onImportComplete(students);
      
      toast({
        title: "Import réussi",
        description: `${students.length} étudiants importés avec succès`,
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
    // Create template with actual class names
    const templateData = [
      { 
        Prénom: "Jean", 
        Nom: "Dupont", 
        Classe: classes[0]?.name || "Exemple", 
        Email: "jean.dupont@email.com",
        "Date de naissance": "2000-01-15",
        CIN: "AB123456",
        "Téléphone étudiant": "+33123456789",
        "Téléphone parent": "+33987654321"
      },
      { 
        Prénom: "Marie", 
        Nom: "Martin", 
        Classe: classes[1]?.name || classes[0]?.name || "Exemple", 
        Email: "marie.martin@email.com",
        "Date de naissance": "2001-05-20",
        CIN: "CD789012",
        "Téléphone étudiant": "+33111222333",
        "Téléphone parent": "+33444555666"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Étudiants");
    
    XLSX.writeFile(wb, 'template_etudiants.xlsx');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import d'Étudiants
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger le modèle
          </Button>
        </div>
        
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-primary bg-primary-light' : 'border-muted-foreground/25'}
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
            <CheckCircle className="h-4 w-4 text-success" />
            <span>Colonnes attendues: Prénom, Nom, Classe, Email, Date de naissance, CIN, Téléphone étudiant, Téléphone parent</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span>Les doublons seront automatiquement ignorés</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};