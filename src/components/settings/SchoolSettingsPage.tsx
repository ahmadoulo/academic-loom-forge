import { useState } from "react";
import { SettingsLayout } from "./SettingsLayout";
import { SchoolSettings } from "./SchoolSettings";
import { StudentAccountsSection } from "../school/StudentAccountsSection";
import { TeacherAccountsSection } from "../school/TeacherAccountsSection";
import { SchoolUserManagement } from "./SchoolUserManagement";
import { SchoolYearManagement } from "./SchoolYearManagement";
import { SemesterManagement } from "./SemesterManagement";
import { CyclesManagement } from "../school/CyclesManagement";
import { OptionsManagement } from "../school/OptionsManagement";
import { SchoolRoleManagement } from "../school/SchoolRoleManagement";
import { UserRoleAssignment } from "../school/UserRoleAssignment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SchoolSettingsPageProps {
  schoolId: string;
  canEdit?: boolean;
}

export function SchoolSettingsPage({ schoolId, canEdit = true }: SchoolSettingsPageProps) {
  const [activeTab, setActiveTab] = useState("school-info");

  const availableTabs = [
    "school-info",
    "semesters",
    "cycles",
    "options",
    "student-accounts",
    "teacher-accounts",
    "users",
    "roles"
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "school-info":
        return <SchoolSettings schoolId={schoolId} canEdit={canEdit} />;
      case "semesters":
        return <SemesterManagement schoolId={schoolId} />;
      case "cycles":
        return <CyclesManagement schoolId={schoolId} />;
      case "options":
        return <OptionsManagement schoolId={schoolId} />;
      case "student-accounts":
        return <StudentAccountsSection schoolId={schoolId} />;
      case "teacher-accounts":
        return <TeacherAccountsSection schoolId={schoolId} />;
      case "users":
        return <SchoolUserManagement schoolId={schoolId} />;
      case "roles":
        return (
          <Tabs defaultValue="manage" className="space-y-6">
            <TabsList>
              <TabsTrigger value="manage">Gestion des rôles</TabsTrigger>
              <TabsTrigger value="assign">Attribution</TabsTrigger>
            </TabsList>
            <TabsContent value="manage">
              <SchoolRoleManagement schoolId={schoolId} />
            </TabsContent>
            <TabsContent value="assign">
              <UserRoleAssignment schoolId={schoolId} />
            </TabsContent>
          </Tabs>
        );
      default:
        return <SchoolSettings schoolId={schoolId} canEdit={canEdit} />;
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
