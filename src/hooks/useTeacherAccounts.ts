import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TeacherAccount {
  id: string;
  teacher_id: string;
  school_id: string;
  email: string;
  is_active: boolean;
  invitation_sent: boolean;
  created_at: string;
  teacher?: {
    firstname: string;
    lastname: string;
    qualification?: string;
  };
}

export const useTeacherAccounts = (schoolId?: string) => {
  const [accounts, setAccounts] = useState<TeacherAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    if (!schoolId) return [];
    
    try {
      setLoading(true);
      
      // Récupérer les professeurs de l'école
      const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('id, firstname, lastname, email, qualification, archived')
        .eq('school_id', schoolId)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (teachersError) throw teachersError;

      // Récupérer les comptes professeurs existants depuis app_users
      const { data: teacherAccounts, error: accountsError } = await supabase
        .from('app_users')
        .select('id, teacher_id, school_id, email, is_active, invitation_token, created_at')
        .eq('school_id', schoolId)
        .not('teacher_id', 'is', null);

      if (accountsError) throw accountsError;

      // Créer une map des comptes existants par teacher_id
      const accountsMap = new Map(teacherAccounts?.map(acc => [acc.teacher_id, acc]) || []);

      // Combiner les données
      const combinedData: TeacherAccount[] = (teachers || []).map((teacher) => {
        const account = accountsMap.get(teacher.id);
        return {
          id: account?.id || teacher.id,
          teacher_id: teacher.id,
          school_id: schoolId,
          email: teacher.email || '',
          is_active: account?.is_active || false,
          invitation_sent: !!account?.invitation_token,
          created_at: account?.created_at || new Date().toISOString(),
          teacher: {
            firstname: teacher.firstname,
            lastname: teacher.lastname,
            qualification: teacher.qualification || undefined
          }
        };
      });

      setAccounts(combinedData);
      return combinedData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des comptes');
      toast.error('Erreur lors du chargement des comptes professeurs');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createTeacherAccount = async (teacherId: string, email: string): Promise<string | null> => {
    try {
      // Vérifier si un compte existe déjà dans app_users pour ce professeur
      const { data: existingAccount } = await supabase
        .from('app_users')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('school_id', schoolId)
        .maybeSingle();

      if (existingAccount) {
        toast.info('Un compte existe déjà pour ce professeur');
        return existingAccount.id;
      }

      // Récupérer les infos du professeur
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('firstname, lastname')
        .eq('id', teacherId)
        .single();

      if (teacherError) throw teacherError;

      // Créer le compte via l'Edge Function
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email,
          firstName: teacher.firstname,
          lastName: teacher.lastname,
          role: 'teacher',
          schoolId: schoolId,
          teacherId: teacherId,
          sendInvitation: true
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error('Erreur lors de la création du compte');
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Compte créé avec succès');
      await fetchAccounts();
      return data?.user?.id || null;
    } catch (err: any) {
      console.error('Erreur création compte:', err);
      toast.error(err.message || 'Erreur lors de la création du compte');
      throw err;
    }
  };

  const sendInvitation = async (teacherId: string, email: string) => {
    try {
      // D'abord créer ou récupérer le compte
      let accountId: string | null = null;
      
      const { data: existingAccount } = await supabase
        .from('app_users')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('school_id', schoolId)
        .maybeSingle();

      if (!existingAccount) {
        accountId = await createTeacherAccount(teacherId, email);
        if (!accountId) {
          const { data: newAccount } = await supabase
            .from('app_users')
            .select('id')
            .eq('teacher_id', teacherId)
            .eq('school_id', schoolId)
            .maybeSingle();
          
          if (!newAccount) {
            throw new Error('Impossible de créer le compte');
          }
          accountId = newAccount.id;
        }
      } else {
        accountId = existingAccount.id;
      }

      // Envoyer l'invitation
      const appUrl = window.location.origin;
      const { data, error } = await supabase.functions.invoke('send-teacher-invitation', {
        body: { accountId, email, appUrl }
      });

      if (error) {
        console.error('Invitation error:', error);
        throw new Error('Erreur lors de l\'envoi de l\'invitation');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(data?.warning ? 'Compte créé (vérifiez la configuration email)' : 'Invitation envoyée avec succès');
      await fetchAccounts();
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', err);
      toast.error(err.message || 'Erreur lors de l\'envoi de l\'invitation');
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
    createTeacherAccount,
    refetch: fetchAccounts
  };
};
