import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const useStudentAccounts = (schoolId?: string) => {
  const [accounts, setAccounts] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    if (!schoolId) return;
    
    try {
      setLoading(true);
      // Récupérer tous les étudiants de l'école
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          firstname,
          lastname,
          email,
          class_id,
          classes (
            name
          )
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      // Récupérer les comptes étudiants existants
      const { data: studentAccounts, error: accountsError } = await supabase
        .from('student_accounts')
        .select('*')
        .eq('school_id', schoolId);

      if (accountsError) throw accountsError;

      // Créer une map des comptes existants par student_id
      const accountsMap = new Map(studentAccounts?.map(acc => [acc.student_id, acc]) || []);

      // Combiner les données
      const combinedData: StudentAccount[] = (students || []).map(student => {
        const account = accountsMap.get(student.id);
        return {
          id: account?.id || student.id,
          student_id: student.id,
          school_id: schoolId,
          email: student.email || '',
          is_active: account?.is_active || false,
          created_at: account?.created_at || new Date().toISOString(),
          student: {
            firstname: student.firstname,
            lastname: student.lastname,
            class_id: student.class_id,
            classes: student.classes
          }
        };
      });

      setAccounts(combinedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des comptes');
      toast.error('Erreur lors du chargement des comptes étudiants');
    } finally {
      setLoading(false);
    }
  };

  const createStudentAccount = async (studentId: string, email: string) => {
    try {
      // Vérifier si un compte existe déjà
      const { data: existingAccount } = await supabase
        .from('student_accounts')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

      if (existingAccount) {
        toast.info('Un compte existe déjà pour cet étudiant');
        return;
      }

      // Créer le compte étudiant
      const invitationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from('student_accounts')
        .insert({
          student_id: studentId,
          school_id: schoolId,
          email: email,
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString(),
          is_active: false
        });

      if (error) throw error;

      toast.success('Compte créé avec succès');
      await fetchAccounts();
    } catch (err) {
      console.error('Erreur création compte:', err);
      toast.error('Erreur lors de la création du compte');
      throw err;
    }
  };

  const sendInvitation = async (studentId: string, email: string) => {
    try {
      // D'abord créer ou mettre à jour le compte
      const { data: existingAccount } = await supabase
        .from('student_accounts')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

      if (!existingAccount) {
        await createStudentAccount(studentId, email);
      }

      // Envoyer l'invitation avec l'URL de l'application
      const appUrl = window.location.origin;
      const { data, error } = await supabase.functions.invoke('send-student-invitation', {
        body: { email, appUrl }
      });

      if (error) throw error;

      toast.success('Invitation envoyée avec succès');
      await fetchAccounts();
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', err);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
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
    sendInvitation,
    createStudentAccount,
    refetch: fetchAccounts
  };
};
