import { useState } from "react";
import { SettingsLayout } from "./SettingsLayout";
import { SchoolSettings } from "./SchoolSettings";
import { StudentAccountsSection } from "../school/StudentAccountsSection";
import { SchoolUserManagement } from "./SchoolUserManagement";
import { SchoolYearManagement } from "./SchoolYearManagement";
import { SemesterManagement } from "./SemesterManagement";

interface SchoolSettingsPageProps {
  schoolId: string;
}

export function SchoolSettingsPage({ schoolId }: SchoolSettingsPageProps) {
  const [activeTab, setActiveTab] = useState("school-info");

  const availableTabs = [
    "school-info",
    "school-years",
    "semesters",
    "student-accounts",
    "users"
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "school-info":
        return <SchoolSettings schoolId={schoolId} />;
      case "school-years":
        return <SchoolYearManagement />;
      case "semesters":
        return <SemesterManagement schoolId={schoolId} />;
      case "student-accounts":
        return <StudentAccountsSection schoolId={schoolId} />;
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
