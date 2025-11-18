import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { SchoolsSection } from "@/components/admin/SchoolsSection";
import { SupportSection } from "@/components/admin/SupportSection";
import { ExamDocumentsList } from "@/components/school/ExamDocumentsList";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { UserManagement } from "@/components/settings/UserManagement";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { RoleManagement } from "@/components/settings/RoleManagement";
import { SchoolYearManagement } from "@/components/settings/SchoolYearManagement";
import { useSchools } from "@/hooks/useSchools";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("schools");
  const [settingsTab, setSettingsTab] = useState("users");
  const { schools } = useSchools();

  const getPageTitle = () => {
    switch (activeTab) {
      case "schools":
        return "Administration des Écoles";
      case "exam-documents":
        return "Documents d'examen";
      case "settings":
        return "Paramètres Système";
      case "support":
        return "Support Utilisateurs";
      default:
        return "Administration Globale";
    }
  };

  const handleSettingsClick = () => {
    setActiveTab("settings");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "schools":
        return <SchoolsSection />;
      case "exam-documents":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Documents d'examen - Toutes les écoles</h2>
              <p className="text-muted-foreground">Consulter et exporter les examens de toutes les écoles</p>
            </div>
            {schools.length > 0 && schools.map((school) => (
              <div key={school.id} className="space-y-4">
                <h3 className="text-xl font-semibold">{school.name}</h3>
                <ExamDocumentsList schoolId={school.id} isAdmin={true} />
              </div>
            ))}
          </div>
        );
      case "settings":
        return (
          <SettingsLayout
            activeTab={settingsTab}
            onTabChange={setSettingsTab}
            availableTabs={["users", "roles", "school-years"]}
          >
            {settingsTab === "users" && <UserManagement />}
            {settingsTab === "roles" && <RoleManagement />}
            {settingsTab === "school-years" && <SchoolYearManagement />}
          </SettingsLayout>
        );
      case "support":
        return <SupportSection />;
      default:
        return <SchoolsSection />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col">
          <AuthenticatedHeader 
            title={getPageTitle()} 
            onSettingsClick={handleSettingsClick}
            showMobileMenu={true}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <main className="flex-1 p-4 lg:p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;