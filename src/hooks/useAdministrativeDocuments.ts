import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdministrativeDocumentType {
  id: string;
  school_id: string;
  cycle_id: string;
  name: string;
  description?: string;
  year_level?: number;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  cycles?: {
    name: string;
  };
}

export interface StudentAdministrativeDocument {
  id: string;
  student_id: string;
  document_type_id: string;
  school_id: string;
  status: 'missing' | 'acquired' | 'pending';
  acquired_at?: string;
  notes?: string;
  file_path?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentWithDocuments {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  cin_number?: string;
  class_id: string;
  class_name: string;
  cycle_id?: string;
  year_level?: number;
  documents: {
    documentTypeId: string;
    status: 'missing' | 'acquired' | 'pending';
    acquiredAt?: string;
    notes?: string;
  }[];
  totalRequired: number;
  totalAcquired: number;
  missingCount: number;
}

export const useAdministrativeDocuments = (schoolId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch document types
  const { data: documentTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ["administrative-document-types", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      
      const { data, error } = await supabase
        .from("administrative_document_types")
        .select(`
          *,
          cycles (name)
        `)
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdministrativeDocumentType[];
    },
    enabled: !!schoolId,
  });

  // Create document type
  const createDocumentType = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      cycle_id: string;
      year_level?: number;
      is_required?: boolean;
    }) => {
      if (!schoolId) throw new Error("School ID required");
      
      const { data: result, error } = await supabase
        .from("administrative_document_types")
        .insert({
          school_id: schoolId,
          ...data,
        })
        .select(`*, cycles (name)`)
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["administrative-document-types"] });
      toast.success("Type de document créé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du type de document");
      console.error(error);
    },
  });

  // Update document type
  const updateDocumentType = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AdministrativeDocumentType> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("administrative_document_types")
        .update(data)
        .eq("id", id)
        .select(`*, cycles (name)`)
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["administrative-document-types"] });
      toast.success("Type de document mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  // Delete (soft) document type
  const deleteDocumentType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("administrative_document_types")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["administrative-document-types"] });
      toast.success("Type de document supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  // Update student document status
  const updateStudentDocument = useMutation({
    mutationFn: async (data: {
      student_id: string;
      document_type_id: string;
      status: 'missing' | 'acquired' | 'pending';
      notes?: string;
    }) => {
      if (!schoolId) throw new Error("School ID required");

      // Upsert to handle both create and update
      const { error } = await supabase
        .from("student_administrative_documents")
        .upsert({
          student_id: data.student_id,
          document_type_id: data.document_type_id,
          school_id: schoolId,
          status: data.status,
          notes: data.notes,
          acquired_at: data.status === 'acquired' ? new Date().toISOString() : null,
        }, {
          onConflict: 'student_id,document_type_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students-with-documents"] });
      toast.success("Document mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  // Bulk update student documents
  const bulkUpdateStudentDocuments = useMutation({
    mutationFn: async (updates: {
      student_id: string;
      document_type_id: string;
      status: 'missing' | 'acquired' | 'pending';
    }[]) => {
      if (!schoolId) throw new Error("School ID required");

      const upsertData = updates.map(u => ({
        student_id: u.student_id,
        document_type_id: u.document_type_id,
        school_id: schoolId,
        status: u.status,
        acquired_at: u.status === 'acquired' ? new Date().toISOString() : null,
      }));

      const { error } = await supabase
        .from("student_administrative_documents")
        .upsert(upsertData, {
          onConflict: 'student_id,document_type_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students-with-documents"] });
      toast.success("Documents mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  return {
    documentTypes: documentTypes || [],
    loadingTypes,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType,
    updateStudentDocument,
    bulkUpdateStudentDocuments,
  };
};

// Separate hook for fetching students with their documents
export const useStudentsWithDocuments = (
  schoolId: string | undefined, 
  classId?: string,
  showMissingOnly?: boolean
) => {
  return useQuery({
    queryKey: ["students-with-documents", schoolId, classId, showMissingOnly],
    queryFn: async (): Promise<StudentWithDocuments[]> => {
      if (!schoolId) return [];

      // 1. Fetch all students with their class info
      let studentQuery = supabase
        .from("student_school")
        .select(`
          student_id,
          class_id,
          students!inner (
            id,
            firstname,
            lastname,
            email,
            cin_number,
            archived
          ),
          classes!inner (
            id,
            name,
            cycle_id,
            year_level
          )
        `)
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .eq("students.archived", false);

      if (classId) {
        studentQuery = studentQuery.eq("class_id", classId);
      }

      const { data: studentsData, error: studentsError } = await studentQuery;
      if (studentsError) throw studentsError;

      // 2. Fetch all document types for this school
      const { data: docTypes, error: docTypesError } = await supabase
        .from("administrative_document_types")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_active", true);

      if (docTypesError) throw docTypesError;

      // 3. Fetch all student documents
      const { data: studentDocs, error: studentDocsError } = await supabase
        .from("student_administrative_documents")
        .select("*")
        .eq("school_id", schoolId);

      if (studentDocsError) throw studentDocsError;

      // 4. Map and calculate
      const result: StudentWithDocuments[] = (studentsData || []).map((item: any) => {
        const student = item.students;
        const classInfo = item.classes;
        
        // Find applicable document types for this student's class
        const applicableDocTypes = (docTypes || []).filter((dt: any) => {
          // Must match cycle
          if (dt.cycle_id !== classInfo.cycle_id) return false;
          // If year_level is specified, student's class must be >= that level
          if (dt.year_level && classInfo.year_level && classInfo.year_level < dt.year_level) {
            return false;
          }
          return true;
        });

        // Get student's document records
        const studentDocRecords = (studentDocs || []).filter(
          (sd: any) => sd.student_id === student.id
        );

        // Map documents
        const documents = applicableDocTypes.map((dt: any) => {
          const record = studentDocRecords.find((sd: any) => sd.document_type_id === dt.id);
          return {
            documentTypeId: dt.id,
            status: (record?.status || 'missing') as 'missing' | 'acquired' | 'pending',
            acquiredAt: record?.acquired_at,
            notes: record?.notes,
          };
        });

        const totalRequired = applicableDocTypes.filter((dt: any) => dt.is_required).length;
        const totalAcquired = documents.filter(d => d.status === 'acquired').length;
        const missingCount = documents.filter(d => d.status === 'missing').length;

        return {
          id: student.id,
          firstname: student.firstname,
          lastname: student.lastname,
          email: student.email,
          cin_number: student.cin_number,
          class_id: item.class_id,
          class_name: classInfo.name,
          cycle_id: classInfo.cycle_id,
          year_level: classInfo.year_level,
          documents,
          totalRequired,
          totalAcquired,
          missingCount,
        };
      });

      // Filter by missing if requested
      if (showMissingOnly) {
        return result.filter(s => s.missingCount > 0);
      }

      return result;
    },
    enabled: !!schoolId,
  });
};
