import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { StudentsGradesSection } from "@/components/student/StudentsGradesSection";
import { StudentWelcomeSection } from "@/components/student/StudentWelcomeSection";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("accueil");

  const renderContent = () => {
    switch (activeTab) {
      case "accueil":
        return <StudentWelcomeSection />;
      case "notes":
        return <StudentsGradesSection />;
      default:
        return <StudentWelcomeSection />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StudentSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col">
          <AuthenticatedHeader 
            title="Interface Étudiant"
            onSettingsClick={() => {}}
          />
          <main className="flex-1 p-6 bg-background">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}