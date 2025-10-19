import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Classroom {
  id: string;
  school_id: string;
  name: string;
  capacity: number;
  building?: string;
  floor?: string;
  equipment?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ClassroomAssignment {
  id: string;
  classroom_id: string;
  assignment_id: string;
  school_id: string;
  created_at: string;
  classrooms?: {
    id: string;
    name: string;
    capacity: number;
  };
  assignments?: {
    id: string;
    title: string;
    session_date: string;
    start_time: string;
    end_time: string;
    type: string;
    subjects?: {
      name: string;
      teachers?: {
        firstname: string;
        lastname: string;
      };
    };
    classes?: {
      name: string;
    };
  };
}

export function useClassrooms(schoolId: string) {
  const queryClient = useQueryClient();

  // Récupérer toutes les salles de cours
  const { data: classrooms = [], isLoading } = useQuery({
    queryKey: ["classrooms", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classrooms")
        .select("*")
        .eq("school_id", schoolId)
        .order("name");

      if (error) throw error;
      return data as Classroom[];
    },
    enabled: !!schoolId,
  });

  // Récupérer les assignations de salles
  const { data: assignments = [] } = useQuery({
    queryKey: ["classroom-assignments", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classroom_assignments")
        .select(`
          *,
          classrooms (
            id,
            name,
            capacity
          ),
          assignments (
            id,
            title,
            session_date,
            start_time,
            end_time,
            type,
            subjects (
              name,
              teachers (
                firstname,
                lastname
              )
            ),
            classes (
              name
            )
          )
        `)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ClassroomAssignment[];
    },
    enabled: !!schoolId,
  });

  // Créer une salle de cours
  const createClassroom = useMutation({
    mutationFn: async (classroom: Omit<Classroom, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("classrooms")
        .insert(classroom)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms", schoolId] });
      toast.success("Salle de cours créée avec succès");
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mettre à jour une salle de cours
  const updateClassroom = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Classroom> & { id: string }) => {
      const { data, error } = await supabase
        .from("classrooms")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms", schoolId] });
      toast.success("Salle de cours mise à jour");
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Supprimer une salle de cours
  const deleteClassroom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("classrooms")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms", schoolId] });
      toast.success("Salle de cours supprimée");
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Assigner une salle à une séance
  const assignClassroom = useMutation({
    mutationFn: async ({
      classroom_id,
      assignment_id,
    }: {
      classroom_id: string;
      assignment_id: string;
    }) => {
      // Vérifier la disponibilité
      const { data: isAvailable, error: checkError } = await supabase.rpc(
        "check_classroom_availability",
        {
          p_classroom_id: classroom_id,
          p_assignment_id: assignment_id,
          p_school_id: schoolId,
        }
      );

      if (checkError) throw checkError;
      if (!isAvailable) {
        throw new Error("Cette salle est déjà occupée à cet horaire");
      }

      const { data, error } = await supabase
        .from("classroom_assignments")
        .insert({
          classroom_id,
          assignment_id,
          school_id: schoolId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroom-assignments", schoolId] });
      toast.success("Salle assignée avec succès");
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Désassigner une salle
  const unassignClassroom = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("classroom_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroom-assignments", schoolId] });
      toast.success("Assignation supprimée");
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    classrooms,
    assignments,
    isLoading,
    createClassroom: createClassroom.mutate,
    updateClassroom: updateClassroom.mutate,
    deleteClassroom: deleteClassroom.mutate,
    assignClassroom: assignClassroom.mutate,
    unassignClassroom: unassignClassroom.mutate,
  };
}
