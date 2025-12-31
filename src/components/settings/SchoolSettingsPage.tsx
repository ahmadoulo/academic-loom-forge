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

interface SchoolSettingsPageProps {
  schoolId: string;
}

export function SchoolSettingsPage({ schoolId }: SchoolSettingsPageProps) {
  const [activeTab, setActiveTab] = useState("school-info");

  const availableTabs = [
    "school-info",
    "semesters",
    "cycles",
    "options",
    "student-accounts",
    "teacher-accounts",
    "users"
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "school-info":
        return <SchoolSettings schoolId={schoolId} />;
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
      default:
        return <SchoolSettings schoolId={schoolId} />;
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
