import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { SchoolsSection } from "@/components/admin/SchoolsSection";
import { SupportSection } from "@/components/admin/SupportSection";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { UserManagement } from "@/components/settings/UserManagement";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { RoleManagement } from "@/components/settings/RoleManagement";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("schools");
  const [settingsTab, setSettingsTab] = useState("users");

  const renderContent = () => {
    switch (activeTab) {
      case "schools":
        return <SchoolsSection />;
      case "settings":
        return (
          <SettingsLayout
            activeTab={settingsTab}
            onTabChange={setSettingsTab}
            availableTabs={["users", "roles"]}
          >
            {settingsTab === "users" && <UserManagement />}
            {settingsTab === "roles" && <RoleManagement />}
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
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;