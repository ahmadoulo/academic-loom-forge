import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocumentTemplate {
  id: string;
  school_id: string;
  name: string;
  type: string;
  content: string;
  is_active: boolean;
  footer_color?: string;
  footer_content?: string;
  header_style?: string;
  created_at: string;
  updated_at: string;
}

export const useDocumentTemplates = (schoolId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["document-templates", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DocumentTemplate[];
    },
    enabled: !!schoolId,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<DocumentTemplate, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("document_templates")
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Modèle créé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du modèle");
      console.error(error);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...template }: Partial<DocumentTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("document_templates")
        .update(template)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Modèle mis à jour avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du modèle");
      console.error(error);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("document_templates")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Modèle supprimé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression du modèle");
      console.error(error);
    },
  });

  return {
    templates: templates || [],
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
