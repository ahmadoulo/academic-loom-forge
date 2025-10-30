import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { StudentsGradesSection } from "@/components/student/StudentsGradesSection";
import { StudentWelcomeSection } from "@/components/student/StudentWelcomeSection";
import { DocumentRequestForm } from "@/components/student/DocumentRequestForm";
import { StudentAssignmentsSection } from "@/components/student/StudentAssignmentsSection";
import { StudentCalendarSection } from "@/components/student/StudentCalendarSection";
import { CalendarSummary } from "@/components/calendar/CalendarSummary";
import { useCurrentStudent } from "@/hooks/useCurrentStudent";
import { useSchools } from "@/hooks/useSchools";
import { supabase } from "@/integrations/supabase/client";
import { EventsSection } from "@/components/school/EventsSection";
import { AnnouncementsSection } from "@/components/school/AnnouncementsSection";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("accueil");
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const queryStudentId = searchParams.get('studentId');
  const [assignments, setAssignments] = useState<any[]>([]);
  
  // Use studentId from params or query parameters
  const currentStudentId = studentId || queryStudentId;
  
  const { student } = useCurrentStudent(currentStudentId);
  
  // Get school information
  const { schools } = useSchools();
  const school = schools.find(s => s.id === student?.school_id);

  useEffect(() => {
    if (student?.class_id) {
      fetchAssignments();
    }
  }, [student?.class_id]);

  const fetchAssignments = async () => {
    if (!student?.class_id) return;
    
    const { data } = await supabase
      .from("assignments")
      .select(`
        id,
        title,
        session_date,
        due_date,
        start_time,
        end_time,
        type,
        is_rescheduled,
        reschedule_reason,
        reschedule_status,
        proposed_new_date,
        original_session_date,
        classes (name)
      `)
      .eq("class_id", student.class_id)
      .gte("session_date", new Date().toISOString().split('T')[0])
      .order("session_date", { ascending: true });
    
    setAssignments(data || []);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "accueil":
        return (
          <div className="space-y-4 lg:space-y-6">
            <StudentWelcomeSection studentId={currentStudentId} />
            <CalendarSummary 
              events={assignments.map(a => ({
                id: a.id,
                title: a.title,
                session_date: a.session_date || a.due_date || "",
                start_time: a.start_time || null,
                end_time: a.end_time || null,
                type: a.type,
                class_name: a.classes?.name,
                is_rescheduled: a.is_rescheduled,
                reschedule_reason: a.reschedule_reason,
                reschedule_status: a.reschedule_status,
                proposed_new_date: a.proposed_new_date,
                original_session_date: a.original_session_date,
              }))}
              title="Mes séances à venir"
            />
          </div>
        );
      case "calendar":
        return student && (
          <StudentCalendarSection 
            studentId={currentStudentId!} 
            classId={student.class_id}
          />
        );
      case "notes":
        return <StudentsGradesSection studentId={currentStudentId} />;
      case "devoirs":
        return <StudentAssignmentsSection studentId={currentStudentId} />;
      case "documents":
        return student && (
          <DocumentRequestForm 
            studentId={currentStudentId!} 
            schoolId={student.school_id} 
          />
        );
      case "events":
        return student ? <EventsSection schoolId={student.school_id} isAdmin={false} /> : null;
      case "announcements":
        return student ? <AnnouncementsSection schoolId={student.school_id} isAdmin={false} userRole="student" /> : null;
      default:
        return <StudentWelcomeSection studentId={currentStudentId} />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full flex-col lg:flex-row">
        <div className="sidebar-container">
          <StudentSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <AuthenticatedHeader 
            title={`${student?.firstname || ''} ${student?.lastname || ''}`}
            onSettingsClick={() => {}}
            showMobileMenu={true}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            schoolName={school?.name}
            schoolLogoUrl={school?.logo_url || undefined}
            userRole="student"
            sidebarContent={
              <StudentSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            }
          />
          <main className="flex-1 p-4 lg:p-6 bg-background overflow-y-auto main-content">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}