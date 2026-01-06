import { useState } from "react";
import { SettingsLayout } from "./SettingsLayout";
import { SchoolSettings } from "./SchoolSettings";
import { StudentAccountsSection } from "../school/StudentAccountsSection";
import { TeacherAccountsSection } from "../school/TeacherAccountsSection";
import { SchoolUserManagement } from "./SchoolUserManagement";
import { SemesterManagement } from "./SemesterManagement";
import { CyclesManagement } from "../school/CyclesManagement";
import { OptionsManagement } from "../school/OptionsManagement";
import { SchoolRoleManagement } from "../school/SchoolRoleManagement";
import { UserRoleAssignment } from "../school/UserRoleAssignment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface SchoolSettingsPageProps {
  schoolId: string;
  canEdit?: boolean;
}

export function SchoolSettingsPage({ schoolId, canEdit = true }: SchoolSettingsPageProps) {
  const [activeTab, setActiveTab] = useState("school-info");
  const { hasPermission, canAccessSection } = useUserPermissions(schoolId);

  // Build available tabs based on permissions
  const availableTabs = [
    canAccessSection('settings') && "school-info",
    canAccessSection('semesters') && "semesters",
    canAccessSection('cycles') && "cycles",
    canAccessSection('options') && "options",
    canAccessSection('student-accounts') && "student-accounts",
    canAccessSection('teacher-accounts') && "teacher-accounts",
    canAccessSection('users') && "users",
    canAccessSection('roles') && "roles",
  ].filter(Boolean) as string[];

  const renderContent = () => {
    switch (activeTab) {
      case "school-info":
        return <SchoolSettings schoolId={schoolId} canEdit={hasPermission('settings.manage')} />;
      case "semesters":
        return <SemesterManagement schoolId={schoolId} canEdit={hasPermission('semesters.manage')} />;
      case "cycles":
        return <CyclesManagement schoolId={schoolId} canEdit={hasPermission('cycles.manage')} />;
      case "options":
        return <OptionsManagement schoolId={schoolId} canEdit={hasPermission('options.manage')} />;
      case "student-accounts":
        return <StudentAccountsSection schoolId={schoolId} canEdit={hasPermission('student-accounts.manage')} />;
      case "teacher-accounts":
        return <TeacherAccountsSection schoolId={schoolId} canEdit={hasPermission('teacher-accounts.manage')} />;
      case "users":
        return <SchoolUserManagement schoolId={schoolId} canEdit={hasPermission('users.manage')} />;
      case "roles":
        return (
          <Tabs defaultValue="manage" className="space-y-6">
            <TabsList>
              <TabsTrigger value="manage">Gestion des rôles</TabsTrigger>
              <TabsTrigger value="assign">Attribution</TabsTrigger>
            </TabsList>
            <TabsContent value="manage">
              <SchoolRoleManagement schoolId={schoolId} canEdit={hasPermission('roles.manage')} />
            </TabsContent>
            <TabsContent value="assign">
              <UserRoleAssignment schoolId={schoolId} canEdit={hasPermission('roles.manage')} />
            </TabsContent>
          </Tabs>
        );
      default:
        return <SchoolSettings schoolId={schoolId} canEdit={hasPermission('settings.manage')} />;
    }
  };

  return (
    <SettingsLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      availableTabs={availableTabs}
    >
      {renderContent()}
    </SettingsLayout>
  );
}
