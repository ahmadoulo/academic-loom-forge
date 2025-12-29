import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SchoolCamera {
  id: string;
  school_id: string;
  name: string;
  rtsp_url: string;
  description: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCameraData {
  school_id: string;
  name: string;
  rtsp_url: string;
  description?: string;
  location?: string;
}

export function useSchoolCameras(schoolId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cameras = [], isLoading, error } = useQuery({
    queryKey: ["school-cameras", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_cameras")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SchoolCamera[];
    },
    enabled: !!schoolId,
  });

  const createCamera = useMutation({
    mutationFn: async (cameraData: CreateCameraData) => {
      const { data, error } = await supabase
        .from("school_cameras")
        .insert(cameraData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-cameras", schoolId] });
      toast({
        title: "Caméra ajoutée",
        description: "La caméra a été ajoutée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la caméra.",
        variant: "destructive",
      });
      console.error("Error creating camera:", error);
    },
  });

  const updateCamera = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SchoolCamera> & { id: string }) => {
      const { data, error } = await supabase
        .from("school_cameras")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-cameras", schoolId] });
      toast({
        title: "Caméra modifiée",
        description: "La caméra a été modifiée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la caméra.",
        variant: "destructive",
      });
      console.error("Error updating camera:", error);
    },
  });

  const deleteCamera = useMutation({
    mutationFn: async (cameraId: string) => {
      const { error } = await supabase
        .from("school_cameras")
        .delete()
        .eq("id", cameraId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-cameras", schoolId] });
      toast({
        title: "Caméra supprimée",
        description: "La caméra a été supprimée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la caméra.",
        variant: "destructive",
      });
      console.error("Error deleting camera:", error);
    },
  });

  return {
    cameras,
    isLoading,
    error,
    createCamera,
    updateCamera,
    deleteCamera,
  };
}
