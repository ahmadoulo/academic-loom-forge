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
        .select('id, teacher_id, school_id, email, is_active, invitation_token, invitation_expires_at, created_at')
        .eq('school_id', schoolId)
        .not('teacher_id', 'is', null);

      if (accountsError) throw accountsError;

      // Créer une map des comptes existants par teacher_id
      const accountsMap = new Map(teacherAccounts?.map(acc => [acc.teacher_id, acc]) || []);

      // Combiner les données
      const combinedData: TeacherAccount[] = (teachers || []).map((teacher) => {
        const account = accountsMap.get(teacher.id);
        // Une invitation est considérée "envoyée" si le token existe et n'est pas expiré
        const hasValidInvitation = account?.invitation_token && 
          account?.invitation_expires_at && 
          new Date(account.invitation_expires_at) > new Date();
        
        return {
          id: account?.id || teacher.id,
          teacher_id: teacher.id,
          school_id: schoolId,
          email: teacher.email || '',
          is_active: account?.is_active || false,
          invitation_sent: !!hasValidInvitation || account?.is_active || false,
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

  const sendInvitation = async (teacherId: string, email: string) => {
    try {
      // Récupérer l'identifiant de l'école
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('identifier')
        .eq('id', schoolId)
        .single();

      if (schoolError || !school) {
        throw new Error('École non trouvée');
      }

      // Utiliser verify-teacher-account qui va créer le compte et envoyer l'invitation
      const { data, error } = await supabase.functions.invoke('verify-teacher-account', {
        body: { 
          email: email.trim().toLowerCase(),
          schoolIdentifier: school.identifier,
          appUrl: window.location.origin,
        }
      });

      if (error) {
        console.error('Invitation error:', error);
        throw new Error('Erreur lors de l\'envoi de l\'invitation');
      }

      if (!data?.success) {
        throw new Error(data?.message || 'Erreur lors de la vérification');
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
    refetch: fetchAccounts
  };
};
