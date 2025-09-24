import { useState, useEffect } from "react";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { SchoolsSection } from "@/components/admin/SchoolsSection";
import { SupportSection } from "@/components/admin/SupportSection";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { UserManagement } from "@/components/settings/UserManagement";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { RoleManagement } from "@/components/settings/RoleManagement";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("schools");
  const [settingsTab, setSettingsTab] = useState("users");
  const { user } = useCustomAuth();

  useEffect(() => {
    console.log('DEBUG AdminDashboard - Utilisateur connecté:', user);
    console.log('DEBUG AdminDashboard - Rôle utilisateur:', user?.role);
  }, [user]);

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
        <div className="flex-1 flex flex-col">
          <AuthenticatedHeader 
            title={getPageTitle()} 
            onSettingsClick={handleSettingsClick}
            showMobileMenu={true}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <main className="flex-1 p-4 lg:p-6">
            {user?.role === 'global_admin' || user?.role === 'admin' ? (
              renderContent()
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Accès non autorisé</h2>
                  <p className="text-muted-foreground">
                    Vous devez être administrateur global pour accéder à cette section.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    DEBUG: Rôle actuel: {user?.role || 'non défini'}
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;