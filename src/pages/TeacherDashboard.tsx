import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSchools } from "@/hooks/useSchools";
import { Header } from "@/components/layout/Header";
import { TeacherSidebar } from "@/components/layout/TeacherSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherDashboard() {
  const { profile, loading } = useAuth();
  const { schools } = useSchools();
  const [activeSection, setActiveSection] = useState("attendance");

  const teacherSchool = schools.find(school => school.id === profile?.school_id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderContent = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord professeur</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Interface professeur en cours de développement...</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title={`Professeur ${profile?.first_name} ${profile?.last_name}`}
        userRole="teacher"
      />
      <div className="flex">
        <TeacherSidebar 
          activeTab={activeSection} 
          onTabChange={setActiveSection} 
        />
        <main className="flex-1 p-6 ml-64">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}