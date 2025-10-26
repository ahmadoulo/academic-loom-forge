import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { SchoolsSection } from "@/components/admin/SchoolsSection";
import { SupportSection } from "@/components/admin/SupportSection";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { UserManagement } from "@/components/settings/UserManagement";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { RoleManagement } from "@/components/settings/RoleManagement";
import { SchoolYearManagement } from "@/components/settings/SchoolYearManagement";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("schools");
  const [settingsTab, setSettingsTab] = useState("users");

  const getPageTitle = () => {
    switch (activeTab) {
      case "schools":
        return "Administration des Écoles";
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
    <SidebarProvider>
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