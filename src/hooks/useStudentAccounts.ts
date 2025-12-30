import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StudentAccount {
  id: string;
  student_id: string;
  school_id: string;
  email: string;
  is_active: boolean;
  invitation_sent: boolean;
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

  const fetchAccounts = async (yearId?: string) => {
    if (!schoolId) return [];
    
    try {
      setLoading(true);
      
      // Construire la requête pour récupérer les étudiants
      let query = supabase
        .from('student_school')
        .select(`
          student_id,
          class_id,
          school_year_id,
          students!inner (
            id,
            firstname,
            lastname,
            email,
            archived
          ),
          classes (
            name
          )
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .eq('students.archived', false);

      // Filtrer par année scolaire si spécifié
      if (yearId && yearId !== 'all') {
        query = query.eq('school_year_id', yearId);
      }

      const { data: enrollments, error: enrollmentsError } = await query.order('created_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      // Récupérer les comptes étudiants existants depuis app_users
      const { data: studentAccounts, error: accountsError } = await supabase
        .from('app_users')
        .select('id, student_id, school_id, email, is_active, invitation_token, created_at')
        .eq('school_id', schoolId)
        .not('student_id', 'is', null);

      if (accountsError) throw accountsError;

      // Créer une map des comptes existants par student_id
      const accountsMap = new Map(studentAccounts?.map(acc => [acc.student_id, acc]) || []);

      // Dédupliquer les étudiants (1 étudiant = 1 compte, même avec plusieurs enrollments)
      const uniqueStudents = new Map<string, any>();
      
      (enrollments || []).forEach((enrollment: any) => {
        const student = enrollment.students;
        const studentId = student.id;
        
        // Si l'étudiant n'est pas encore dans la map, l'ajouter
        if (!uniqueStudents.has(studentId)) {
          uniqueStudents.set(studentId, {
            student,
            enrollment
          });
        }
      });

      // Combiner les données uniques
      const combinedData: StudentAccount[] = Array.from(uniqueStudents.values()).map(({ student, enrollment }) => {
        const account = accountsMap.get(student.id);
        return {
          id: account?.id || student.id,
          student_id: student.id,
          school_id: schoolId,
          email: student.email || '',
          is_active: account?.is_active || false,
          invitation_sent: !!account?.invitation_token,
          created_at: account?.created_at || new Date().toISOString(),
          student: {
            firstname: student.firstname,
            lastname: student.lastname,
            class_id: enrollment.class_id,
            classes: enrollment.classes
          }
        };
      });

      // Mettre à jour l'état seulement si pas de yearId (appel par défaut)
      if (!yearId) {
        setAccounts(combinedData);
      }
      
      return combinedData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des comptes');
      toast.error('Erreur lors du chargement des comptes étudiants');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createStudentAccount = async (studentId: string, email: string) => {
    try {
      // Vérifier si un compte existe déjà dans app_users
      const { data: existingAccount } = await supabase
        .from('app_users')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

      if (existingAccount) {
        toast.info('Un compte existe déjà pour cet étudiant');
        return;
      }

      // Récupérer les infos de l'étudiant
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('firstname, lastname')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Créer le compte via l'Edge Function
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email,
          firstName: student.firstname,
          lastName: student.lastname,
          role: 'student',
          schoolId: schoolId,
          studentId: studentId,
          sendInvitation: false
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

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
      // D'abord créer ou récupérer le compte
      let accountId: string;
      
      const { data: existingAccount } = await supabase
        .from('app_users')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

      if (!existingAccount) {
        await createStudentAccount(studentId, email);
        
        // Récupérer l'ID du compte nouvellement créé
        const { data: newAccount } = await supabase
          .from('app_users')
          .select('id')
          .eq('student_id', studentId)
          .maybeSingle();
        
        if (!newAccount) {
          throw new Error('Impossible de créer le compte');
        }
        accountId = newAccount.id;
      } else {
        accountId = existingAccount.id;
      }

      // Envoyer l'invitation avec l'accountId et l'URL de l'application
      const appUrl = window.location.origin;
      const { data, error } = await supabase.functions.invoke('send-student-invitation', {
        body: { accountId, email, appUrl }
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
    refetch: fetchAccounts,
    fetchAccountsByYear: fetchAccounts
  };
};
