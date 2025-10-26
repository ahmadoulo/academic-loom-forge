import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface LoginCredentials {
  email: string;
  password: string;
}

interface CreateUserCredentials {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  school_id?: string;
}

interface UserCredential {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  school_id?: string;
  is_active: boolean;
  last_login?: string;
  teacher_id?: string;
  student_id?: string;
}

export const useCustomAuth = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserCredential | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Hachage simple côté client (pour démo - en prod utiliser un service backend)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt123'); // Ajout d'un salt simple
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    const computedHash = await hashPassword(password);
    return computedHash === hash;
  };

  const createUserCredential = async (userData: CreateUserCredentials) => {
    try {
      setLoading(true);
      
      const passwordHash = await hashPassword(userData.password);
      
      const { data, error } = await supabase
        .from('user_credentials')
        .insert([{
          email: userData.email,
          password_hash: passwordHash,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          school_id: userData.school_id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Si c'est un professeur, créer aussi un enregistrement dans la table teachers
      if (userData.role === 'teacher' && userData.school_id) {
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert([{
            firstname: userData.first_name,
            lastname: userData.last_name,
            email: userData.email,
            school_id: userData.school_id,
          }]);

        if (teacherError) {
          console.error('Erreur lors de la création du professeur:', teacherError);
          // Ne pas faire échouer la création de l'utilisateur pour cette erreur
        }
      }
      
      toast.success('Utilisateur créé avec succès');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de l\'utilisateur';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = async ({ email, password }: LoginCredentials) => {
    try {
      setLoading(true);
      console.log('🔐 Tentative de connexion pour:', email);

      // Import bcrypt une seule fois
      const bcrypt = await import('bcryptjs');

      // Vérifier d'abord dans student_accounts
      const { data: studentAccount, error: studentError } = await supabase
        .from('student_accounts')
        .select('id, email, password_hash, is_active, student_id, school_id')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (studentError) {
        console.error('❌ Erreur student_accounts:', studentError);
      }

      console.log('📊 Résultat student_accounts:', {
        found: !!studentAccount,
        hasPassword: !!studentAccount?.password_hash,
        isActive: studentAccount?.is_active
      });

      if (studentAccount?.password_hash) {
        console.log('✅ Compte étudiant trouvé, vérification du mot de passe...');
        
        const isValid = await bcrypt.compare(password, studentAccount.password_hash);
        console.log('🔑 Mot de passe valide?', isValid);

        if (isValid) {
          // Récupérer les infos de l'étudiant depuis la table students
          const { data: student, error: studentInfoError } = await supabase
            .from('students')
            .select('id, firstname, lastname')
            .eq('id', studentAccount.student_id)
            .single();

          if (studentInfoError || !student) {
            console.error('❌ Erreur lors de la récupération des infos étudiant:', studentInfoError);
            toast.error('Erreur lors de la récupération des informations');
            throw new Error('Impossible de récupérer les informations étudiant');
          }

          // Récupérer l'école depuis student_school
          const { data: enrollment } = await supabase
            .from('student_school')
            .select('school_id')
            .eq('student_id', studentAccount.student_id)
            .eq('is_active', true)
            .single();

          console.log('👨‍🎓 Infos étudiant récupérées:', student, enrollment);

          const userData: UserCredential = {
            id: studentAccount.id,
            email: studentAccount.email,
            first_name: student.firstname,
            last_name: student.lastname,
            role: 'student',
            school_id: enrollment?.school_id || null,
            student_id: student.id,
            is_active: true,
            last_login: new Date().toISOString(),
          };

          localStorage.setItem('customAuthUser', JSON.stringify(userData));
          setUser(userData);

          // Mise à jour de last_login
          await supabase
            .from('student_accounts')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', studentAccount.id);

          toast.success('Connexion réussie !');
          console.log('✅ Connexion étudiant réussie, redirection vers dashboard...');
          
          // Redirection vers student dashboard
          setTimeout(() => {
            window.location.href = `/student/${student.id}`;
          }, 500);
          
          return userData;
        } else {
          console.log('❌ Mot de passe incorrect');
          toast.error('Email ou mot de passe incorrect');
          throw new Error('Mot de passe incorrect');
        }
      }

      // Sinon, vérifier dans user_credentials
      const { data: credential, error: credError } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (credError) {
        console.error('❌ Erreur user_credentials:', credError);
      }

      console.log('📊 Résultat user_credentials:', !!credential);

      if (!credential) {
        console.log('❌ Aucun compte trouvé');
        toast.error('Email ou mot de passe incorrect');
        throw new Error('Identifiants incorrects');
      }

      // Vérifier le mot de passe pour user_credentials (utilise le hash SHA-256)
      const computedHash = await hashPassword(password);
      const isValidPassword = computedHash === credential.password_hash;
      
      console.log('🔑 Mot de passe valide (credentials)?', isValidPassword);

      if (!isValidPassword) {
        toast.error('Email ou mot de passe incorrect');
        throw new Error('Mot de passe incorrect');
      }

      // Trouver le teacher_id si c'est un enseignant
      let teacherId = null;
      if (credential.role === 'teacher') {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', email)
          .eq('school_id', credential.school_id)
          .maybeSingle();
        
        teacherId = teacher?.id || null;
        console.log('👨‍🏫 Teacher ID trouvé:', teacherId);
      }

      const userData: UserCredential = {
        id: credential.id,
        email: credential.email,
        first_name: credential.first_name,
        last_name: credential.last_name,
        role: credential.role as 'student' | 'teacher' | 'school_admin' | 'global_admin' | 'admin',
        school_id: credential.school_id,
        teacher_id: teacherId,
        is_active: credential.is_active,
        last_login: new Date().toISOString(),
      };

      localStorage.setItem('customAuthUser', JSON.stringify(userData));
      setUser(userData);

      // Mise à jour de last_login
      await supabase
        .from('user_credentials')
        .update({ last_login: new Date().toISOString() })
        .eq('id', credential.id);

      toast.success('Connexion réussie !');
      console.log('✅ Connexion réussie pour:', userData);
      
      // Redirection
      setTimeout(() => {
        if (userData.role === 'global_admin' || userData.role === 'admin') {
          window.location.href = '/admin';
        } else if (userData.role === 'school_admin' && userData.school_id) {
          window.location.href = `/school/${userData.school_id}`;
        } else if (userData.role === 'teacher' && userData.teacher_id) {
          window.location.href = `/teacher/${userData.teacher_id}`;
        } else {
          window.location.href = '/dashboard';
        }
      }, 500);
      
      return userData;
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la connexion';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    // Nettoyer complètement le localStorage
    localStorage.removeItem('customAuthUser');
    localStorage.clear(); // Nettoyer toutes les sessions en cache
    
    toast.success('Déconnexion réussie');
    
    // Forcer le rechargement complet pour vider le cache React
    window.location.replace('/auth');
  }, []);

  const checkAuthStatus = useCallback(() => {
    if (initialized) return; // Éviter les appels multiples
    
    const storedUser = localStorage.getItem('customAuthUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('customAuthUser');
        setUser(null);
      }
    }
    setInitialized(true);
  }, [initialized]);

  // Initialiser l'état une seule fois au montage du hook
  useEffect(() => {
    if (!initialized) {
      checkAuthStatus();
    }
  }, [checkAuthStatus, initialized]);

  return {
    user,
    loading: loading || !initialized,
    createUserCredential,
    loginWithCredentials,
    logout,
    checkAuthStatus,
    hashPassword,
  };
};