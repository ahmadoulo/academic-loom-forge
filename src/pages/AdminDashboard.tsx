import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { SupportSection } from "@/components/admin/SupportSection";
import { AdminSaaSDashboard } from "@/components/admin/AdminSaaSDashboard";
import { SchoolsManagement } from "@/components/admin/SchoolsManagement";
import { SubscriptionForm } from "@/components/admin/SubscriptionForm";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { UserManagement } from "@/components/settings/UserManagement";
import { RoleManagement } from "@/components/settings/RoleManagement";
import { SchoolYearManagement } from "@/components/settings/SchoolYearManagement";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchoolForm } from "@/components/admin/SchoolForm";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [settingsTab, setSettingsTab] = useState("users");
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Tableau de Bord SaaS";
      case "schools":
        return "Gestion des Écoles";
      case "subscriptions":
        return "Gestion des Abonnements";
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

  const handleViewSchool = (schoolId: string) => {
    const schoolsData = [] as any; // This will be populated from useSchools
    const school = schoolsData.find((s: any) => s.id === schoolId);
    if (school) {
      navigate(`/school/${school.identifier}`);
    }
  };

  const handleEditSchool = (school: any) => {
    // This is now handled in SchoolsManagement component
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <AdminSaaSDashboard
            onAddSchool={() => setShowSchoolDialog(true)}
            onCreateSubscription={() => setShowSubscriptionDialog(true)}
            onManageTrials={() => setActiveTab("subscriptions")}
            onViewSchools={() => setActiveTab("schools")}
            onViewSubscriptions={() => setActiveTab("subscriptions")}
          />
        );
      case "schools":
        return (
          <SchoolsManagement
            onAddSchool={() => setShowSchoolDialog(true)}
            onEditSchool={handleEditSchool}
            onViewSchool={handleViewSchool}
          />
        );
      case "subscriptions":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Gestion des Abonnements</h2>
                <p className="text-muted-foreground">Créez et gérez les abonnements de toutes les écoles</p>
              </div>
              <Button onClick={() => setShowSubscriptionDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Créer un Abonnement
              </Button>
            </div>
            {/* TODO: Add subscriptions list here */}
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
        return (
          <AdminSaaSDashboard
            onAddSchool={() => setShowSchoolDialog(true)}
            onCreateSubscription={() => setShowSubscriptionDialog(true)}
            onManageTrials={() => setActiveTab("subscriptions")}
            onViewSchools={() => setActiveTab("schools")}
            onViewSubscriptions={() => setActiveTab("subscriptions")}
          />
        );
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


      {/* School Dialog */}
      <Dialog open={showSchoolDialog} onOpenChange={setShowSchoolDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une École</DialogTitle>
          </DialogHeader>
          <SchoolForm
            onSuccess={() => {
              setShowSchoolDialog(false);
            }}
            onCancel={() => setShowSchoolDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un Abonnement</DialogTitle>
          </DialogHeader>
          <SubscriptionForm
            onSuccess={() => {
              setShowSubscriptionDialog(false);
            }}
            onCancel={() => setShowSubscriptionDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminDashboard;