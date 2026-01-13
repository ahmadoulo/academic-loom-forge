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
    id: string;
    name: string;
    duration_years?: number;
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
  cycle_name?: string;
  year_level?: number;
  documents: {
    documentTypeId: string;
    documentName: string;
    status: 'missing' | 'acquired' | 'pending';
    acquiredAt?: string;
    notes?: string;
    is_required: boolean;
    doc_year_level?: number;
  }[];
  totalRequired: number;
  totalAcquired: number;
  missingCount: number;
}

export const useAdministrativeDocuments = (schoolId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch document types with cycle info
  const { data: documentTypes, isLoading: loadingTypes, refetch: refetchTypes } = useQuery({
    queryKey: ["administrative-document-types", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      
      const { data, error } = await supabase
        .from("administrative_document_types")
        .select(`
          *,
          cycles (id, name, duration_years)
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
        .select(`*, cycles (id, name, duration_years)`)
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["administrative-document-types", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["students-with-documents", schoolId] });
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
        .select(`*, cycles (id, name, duration_years)`)
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["administrative-document-types", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["students-with-documents", schoolId] });
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
      queryClient.invalidateQueries({ queryKey: ["administrative-document-types", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["students-with-documents", schoolId] });
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
      queryClient.invalidateQueries({ queryKey: ["students-with-documents", schoolId] });
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
      queryClient.invalidateQueries({ queryKey: ["students-with-documents", schoolId] });
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
    refetchTypes,
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
  showMissingOnly?: boolean,
  schoolYearId?: string
) => {
  return useQuery({
    queryKey: ["students-with-documents", schoolId, classId, showMissingOnly, schoolYearId],
    queryFn: async (): Promise<StudentWithDocuments[]> => {
      if (!schoolId) return [];

      // 1. Fetch all students enrolled in this school with their class info
      let studentSchoolQuery = supabase
        .from("student_school")
        .select("student_id, class_id, school_year_id")
        .eq("school_id", schoolId)
        .eq("is_active", true);

      // Filter by school year if provided
      if (schoolYearId) {
        studentSchoolQuery = studentSchoolQuery.eq("school_year_id", schoolYearId);
      }

      if (classId) {
        studentSchoolQuery = studentSchoolQuery.eq("class_id", classId);
      }

      const { data: studentSchoolData, error: ssError } = await studentSchoolQuery;

      if (ssError) {
        console.error("Error fetching student_school:", ssError);
        throw ssError;
      }

      if (!studentSchoolData || studentSchoolData.length === 0) {
        return [];
      }

      // Get unique student IDs and class IDs
      const studentIds = [...new Set(studentSchoolData.map(ss => ss.student_id))];
      const classIds = [...new Set(studentSchoolData.map(ss => ss.class_id).filter(Boolean))];

      // 2. Fetch students data
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, firstname, lastname, email, cin_number, archived")
        .in("id", studentIds)
        .eq("archived", false);

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
        throw studentsError;
      }

      // 3. Fetch classes data WITH cycle_id and year_level
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id, name, cycle_id, year_level")
        .in("id", classIds)
        .eq("archived", false);

      if (classesError) {
        console.error("Error fetching classes:", classesError);
        throw classesError;
      }

      // 4. Get cycle info for classes that have cycle_id
      const cycleIds = [...new Set((classesData || []).map(c => c.cycle_id).filter(Boolean))];
      let cyclesMap = new Map<string, { name: string; duration_years?: number }>();
      
      if (cycleIds.length > 0) {
        const { data: cyclesData } = await supabase
          .from("cycles")
          .select("id, name, duration_years")
          .in("id", cycleIds);
        
        cyclesMap = new Map((cyclesData || []).map(c => [c.id, { name: c.name, duration_years: c.duration_years }]));
      }

      // 5. Fetch all document types for this school
      const { data: docTypes, error: docTypesError } = await supabase
        .from("administrative_document_types")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_active", true);

      if (docTypesError) {
        console.error("Error fetching doc types:", docTypesError);
        throw docTypesError;
      }

      // 6. Fetch all student documents for this school
      const { data: studentDocs, error: studentDocsError } = await supabase
        .from("student_administrative_documents")
        .select("*")
        .eq("school_id", schoolId)
        .in("student_id", studentIds);

      if (studentDocsError) {
        console.error("Error fetching student docs:", studentDocsError);
        throw studentDocsError;
      }

      // Create lookup maps
      const studentsMap = new Map(studentsData?.map(s => [s.id, s]) || []);
      const classesMap = new Map(classesData?.map(c => [c.id, c]) || []);

      // Build student -> class mapping (one class per student for simplicity)
      const studentClassMap = new Map<string, string>();
      studentSchoolData.forEach(ss => {
        if (!studentClassMap.has(ss.student_id) && ss.class_id) {
          studentClassMap.set(ss.student_id, ss.class_id);
        }
      });

      const result: StudentWithDocuments[] = [];
      
      studentClassMap.forEach((classIdVal, studentId) => {
        const student = studentsMap.get(studentId);
        const classInfo = classesMap.get(classIdVal);
        
        if (!student || !classInfo) return;

        const cycleInfo = classInfo.cycle_id ? cyclesMap.get(classInfo.cycle_id) : null;
        const studentYearLevel = classInfo.year_level || 1;

        // Find applicable document types for this student's class
        // A document applies if:
        // 1. It's for the same cycle as the student's class
        // 2. If the document has a year_level, the student's year_level must be >= that level
        const applicableDocTypes = (docTypes || []).filter((dt: any) => {
          // Must match cycle
          if (!classInfo.cycle_id || dt.cycle_id !== classInfo.cycle_id) return false;
          
          // If document specifies a year_level, student must be at or above that level
          if (dt.year_level && studentYearLevel < dt.year_level) {
            return false;
          }
          return true;
        });

        // Get student's document records
        const studentDocRecords = (studentDocs || []).filter(
          (sd: any) => sd.student_id === student.id
        );

        // Map documents with full info
        const documents = applicableDocTypes.map((dt: any) => {
          const record = studentDocRecords.find((sd: any) => sd.document_type_id === dt.id);
          return {
            documentTypeId: dt.id,
            documentName: dt.name,
            status: (record?.status || 'missing') as 'missing' | 'acquired' | 'pending',
            acquiredAt: record?.acquired_at,
            notes: record?.notes,
            is_required: dt.is_required,
            doc_year_level: dt.year_level,
          };
        });

        const totalRequired = applicableDocTypes.filter((dt: any) => dt.is_required).length;
        const totalAcquired = documents.filter(d => d.status === 'acquired').length;
        const missingCount = documents.filter(d => d.status === 'missing' || d.status === 'pending').length;

        result.push({
          id: student.id,
          firstname: student.firstname,
          lastname: student.lastname,
          email: student.email,
          cin_number: student.cin_number,
          class_id: classIdVal,
          class_name: classInfo.name,
          cycle_id: classInfo.cycle_id || undefined,
          cycle_name: cycleInfo?.name,
          year_level: studentYearLevel,
          documents,
          totalRequired,
          totalAcquired,
          missingCount,
        });
      });

      // Sort by lastname, firstname
      result.sort((a, b) => {
        const lastNameCompare = a.lastname.localeCompare(b.lastname);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstname.localeCompare(b.firstname);
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

// Hook to get classes with cycle info for filtering
export const useClassesWithCycles = (schoolId: string | undefined, schoolYearId?: string | null, includeAllYears?: boolean) => {
  return useQuery({
    queryKey: ["classes-with-cycles", schoolId, schoolYearId, includeAllYears],
    queryFn: async () => {
      if (!schoolId) return [];

      let query = supabase
        .from("classes")
        .select(`
          id,
          name,
          cycle_id,
          year_level,
          school_year_id,
          cycles (id, name, duration_years),
          school_years:school_year_id (id, name, is_current)
        `)
        .eq("school_id", schoolId)
        .eq("archived", false);

      // Filter by school year unless including all years
      if (!includeAllYears && schoolYearId) {
        query = query.eq("school_year_id", schoolYearId);
      }

      const { data, error } = await query.order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });
};
