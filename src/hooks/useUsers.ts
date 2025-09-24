import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "./useAuth";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  school_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  school_id?: string;
}

export function useUsers(schoolId?: string) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase.from("profiles").select("*");
      
      if (schoolId) {
        query = query.eq("school_id", schoolId);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            school_id: userData.school_id
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Créer le profil dans la table profiles
        const profileData = {
          user_id: authData.user.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          school_id: userData.school_id || null,
          is_active: true
        };

        const { error: profileError } = await supabase
          .from("profiles")
          .insert(profileData);

        if (profileError) throw profileError;

        // 3. Si c'est un professeur, créer l'entrée dans la table teachers
        if (userData.role === 'teacher' && userData.school_id) {
          const { error: teacherError } = await supabase
            .from("teachers")
            .insert({
              firstname: userData.first_name,
              lastname: userData.last_name,
              email: userData.email,
              school_id: userData.school_id
            });

          if (teacherError) throw teacherError;
        }

        await fetchUsers();
        
        toast({
          title: "Utilisateur créé avec succès",
          description: `${userData.first_name} ${userData.last_name} a été ajouté à la plateforme.`,
        });

        return { success: true, password: userData.password };
      }
    } catch (err: any) {
      console.error("Error creating user:", err);
      toast({
        variant: "destructive",
        title: "Erreur lors de la création",
        description: err.message || "Impossible de créer l'utilisateur",
      });
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;

      await fetchUsers();
      
      toast({
        title: "Utilisateur mis à jour",
        description: "Les informations ont été sauvegardées avec succès.",
      });
    } catch (err: any) {
      console.error("Error updating user:", err);
      toast({
        variant: "destructive",
        title: "Erreur de mise à jour",
        description: err.message || "Impossible de mettre à jour l'utilisateur",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Supprimer le profil (l'utilisateur auth sera supprimé en cascade)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      await fetchUsers();
      
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: err.message || "Impossible de supprimer l'utilisateur",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [schoolId]);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers,
    generatePassword
  };
}