import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export interface StudentAccount {
  id: string;
  student_id: string;
  school_id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  student?: {
    firstname: string;
    lastname: string;
    class_id: string;
    classes?: {
      name: string;
    };
  };
}

export interface StudentImportData {
  firstname: string;
  lastname: string;
  email: string;
  class_name: string;
}

export const useStudentAccounts = (schoolId?: string) => {
  const [accounts, setAccounts] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    if (!schoolId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_accounts')
        .select(`
          *,
          student:students (
            firstname,
            lastname,
            class_id,
            classes (
              name
            )
          )
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des comptes');
      toast.error('Erreur lors du chargement des comptes étudiants');
    } finally {
      setLoading(false);
    }
  };

  const importStudentsFromExcel = async (file: File, classes: Array<{ id: string; name: string }>) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const studentsToImport: StudentImportData[] = jsonData.map((row) => ({
        firstname: row['Prénom'] || row['Prenom'] || row['firstname'] || '',
        lastname: row['Nom'] || row['lastname'] || '',
        email: row['Email'] || row['email'] || '',
        class_name: row['Classe'] || row['class'] || ''
      }));

      // Valider que tous les étudiants ont un email
      const invalidStudents = studentsToImport.filter(s => !s.email || !s.firstname || !s.lastname);
      if (invalidStudents.length > 0) {
        toast.error(`${invalidStudents.length} étudiant(s) sans email, prénom ou nom valide`);
        return;
      }

      // Créer les étudiants et leurs comptes
      let successCount = 0;
      let errorCount = 0;

      for (const studentData of studentsToImport) {
        try {
          // Trouver la classe
          const classMatch = classes.find(c => 
            c.name.toLowerCase() === studentData.class_name.toLowerCase()
          );

          if (!classMatch) {
            console.error(`Classe non trouvée: ${studentData.class_name}`);
            errorCount++;
            continue;
          }

          // Créer l'étudiant
          const { data: student, error: studentError } = await supabase
            .from('students')
            .insert({
              firstname: studentData.firstname,
              lastname: studentData.lastname,
              email: studentData.email,
              class_id: classMatch.id,
              school_id: schoolId
            })
            .select()
            .single();

          if (studentError) throw studentError;

          // Créer le compte étudiant
          const invitationToken = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours pour activer le compte

          const { error: accountError } = await supabase
            .from('student_accounts')
            .insert({
              student_id: student.id,
              school_id: schoolId,
              email: studentData.email,
              invitation_token: invitationToken,
              invitation_expires_at: expiresAt.toISOString(),
              is_active: false
            });

          if (accountError) throw accountError;

          successCount++;
        } catch (err) {
          console.error('Erreur import étudiant:', err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} étudiant(s) importé(s) avec succès`);
        await fetchAccounts();
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} étudiant(s) n'ont pas pu être importés`);
      }

    } catch (err) {
      console.error('Erreur lors de l\'import:', err);
      toast.error('Erreur lors de l\'import du fichier');
      throw err;
    }
  };

  const sendInvitation = async (accountId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-student-invitation', {
        body: { accountId }
      });

      if (error) throw error;

      toast.success('Invitation envoyée avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', err);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
      throw err;
    }
  };

  const deleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('student_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      toast.success('Compte supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression du compte');
      throw err;
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchAccounts();
    }
  }, [schoolId]);

  return {
    accounts,
    loading,
    error,
    importStudentsFromExcel,
    sendInvitation,
    deleteAccount,
    refetch: fetchAccounts
  };
};
