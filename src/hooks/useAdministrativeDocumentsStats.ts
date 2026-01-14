import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClassDocumentStats {
  classId: string;
  className: string;
  totalStudents: number;
  studentsWithRequirements: number;
  completeCount: number;
  incompleteCount: number;
  totalMissingDocs: number;
  completionRate: number;
}

export const useAdministrativeDocumentsStats = (
  schoolId: string | undefined,
  schoolYearId?: string
) => {
  return useQuery({
    queryKey: ["administrative-documents-stats", schoolId, schoolYearId],
    queryFn: async (): Promise<ClassDocumentStats[]> => {
      if (!schoolId) return [];

      // Get current year if not provided
      let effectiveYearId = schoolYearId;
      if (!effectiveYearId) {
        const { data: currentYear } = await (supabase as any)
          .from("school_years")
          .select("id")
          .eq("school_id", schoolId)
          .eq("is_current", true)
          .maybeSingle();
        effectiveYearId = currentYear?.id;
      }

      if (!effectiveYearId) return [];

      // Get classes for the year
      const { data: classes, error: classesError } = await supabase
        .from("classes")
        .select("id, name, cycle_id, year_level")
        .eq("school_id", schoolId)
        .eq("school_year_id", effectiveYearId)
        .eq("archived", false);

      if (classesError || !classes) return [];

      // Get document types
      const { data: docTypes, error: docTypesError } = await supabase
        .from("administrative_document_types")
        .select("id, name, cycle_id, year_level, is_required")
        .eq("school_id", schoolId)
        .eq("is_active", true);

      if (docTypesError) return [];

      // Get student enrollments
      const { data: enrollments, error: enrollmentsError } = await (supabase as any)
        .from("student_school")
        .select("student_id, class_id")
        .eq("school_id", schoolId)
        .eq("school_year_id", effectiveYearId)
        .eq("is_active", true);

      if (enrollmentsError) return [];

      // Get student documents
      const { data: studentDocs, error: studentDocsError } = await (supabase as any)
        .from("student_administrative_documents")
        .select("student_id, document_type_id, status")
        .eq("school_id", schoolId);

      if (studentDocsError) return [];

      // Build stats for each class
      const results: ClassDocumentStats[] = [];

      for (const cls of classes) {
        // Get students in this class
        const classEnrollments = enrollments.filter((e: any) => e.class_id === cls.id);
        const studentIds = classEnrollments.map((e: any) => e.student_id);
        const totalStudents = studentIds.length;

        if (totalStudents === 0) continue;

        // Get document types applicable to this class
        const applicableDocTypes = docTypes?.filter((dt: any) => {
          if (!dt.is_required) return false;
          if (dt.cycle_id !== cls.cycle_id) return false;
          // If year_level is specified, it must match
          if (dt.year_level && dt.year_level !== cls.year_level) return false;
          return true;
        }) || [];

        if (applicableDocTypes.length === 0) continue;

        const docTypeIds = applicableDocTypes.map((dt: any) => dt.id);

        let studentsWithRequirements = 0;
        let completeCount = 0;
        let totalMissingDocs = 0;

        studentIds.forEach((studentId: string) => {
          const studentDocStatuses = studentDocs.filter(
            (sd: any) => sd.student_id === studentId && docTypeIds.includes(sd.document_type_id)
          );

          const acquiredCount = studentDocStatuses.filter(
            (sd: any) => sd.status === "acquired"
          ).length;
          const requiredCount = applicableDocTypes.length;

          studentsWithRequirements++;
          const missing = requiredCount - acquiredCount;
          totalMissingDocs += missing;

          if (missing === 0) {
            completeCount++;
          }
        });

        const incompleteCount = studentsWithRequirements - completeCount;
        const completionRate = studentsWithRequirements > 0
          ? Math.round((completeCount / studentsWithRequirements) * 100)
          : 100;

        results.push({
          classId: cls.id,
          className: cls.name,
          totalStudents,
          studentsWithRequirements,
          completeCount,
          incompleteCount,
          totalMissingDocs,
          completionRate,
        });
      }

      return results.sort((a, b) => a.completionRate - b.completionRate);
    },
    enabled: !!schoolId,
  });
};
