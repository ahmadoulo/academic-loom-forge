import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { SupportSection } from "@/components/admin/SupportSection";
import { AdminSaaSDashboard } from "@/components/admin/AdminSaaSDashboard";
import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";
import { SchoolsManagement } from "@/components/admin/SchoolsManagement";
import { SubscriptionForm } from "@/components/admin/SubscriptionForm";
import { SubscriptionsSection } from "@/components/admin/SubscriptionsSection";
import { SubscriptionPlanManagement } from "@/components/admin/SubscriptionPlanManagement";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { SchoolYearManagement } from "@/components/settings/SchoolYearManagement";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchoolForm } from "@/components/admin/SchoolForm";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [settingsTab, setSettingsTab] = useState("school-years");
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
          <div className="space-y-8">
            <AdminSaaSDashboard
              onAddSchool={() => setShowSchoolDialog(true)}
              onCreateSubscription={() => setShowSubscriptionDialog(true)}
              onManageTrials={() => setActiveTab("subscriptions")}
              onViewSchools={() => setActiveTab("schools")}
              onViewSubscriptions={() => setActiveTab("subscriptions")}
            />
            <div className="border-t pt-8">
              <AdminAnalyticsDashboard />
            </div>
          </div>
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
          <div className="space-y-8">
            <SubscriptionPlanManagement />
            <div className="border-t pt-8">
              <SubscriptionsSection />
            </div>
          </div>
        );
      case "settings":
        return (
          <SettingsLayout
            activeTab={settingsTab}
            onTabChange={setSettingsTab}
            availableTabs={["school-years"]}
          >
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