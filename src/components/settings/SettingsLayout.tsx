import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Building, Users, UserCog, Calendar, GraduationCap } from "lucide-react";

interface SettingsLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (value: string) => void;
  availableTabs: string[];
}

const sectionConfig = {
  general: {
    title: "Informations Générales",
    icon: Building,
    tabs: ["school-info"]
  },
  academic: {
    title: "Gestion Académique",
    icon: Calendar,
    tabs: ["school-years", "semesters"]
  },
  students: {
    title: "Comptes Étudiants",
    icon: GraduationCap,
    tabs: ["student-accounts"]
  },
  users: {
    title: "Utilisateurs & Rôles",
    icon: UserCog,
    tabs: ["users", "roles"]
  }
};

const tabLabels: Record<string, string> = {
  "school-info": "Informations de l'école",
  "school-years": "Années scolaires",
  "semesters": "Semestres",
  "student-accounts": "Comptes étudiants",
  "users": "Gestion des utilisateurs",
  "roles": "Rôles & Permissions"
};

export function SettingsLayout({ children, activeTab, onTabChange, availableTabs }: SettingsLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Paramètres
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez votre compte et les préférences de votre organisation
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <Card className="w-64 shadow-large border-0 bg-gradient-card backdrop-blur-sm h-fit sticky top-6">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="p-4 space-y-6">
                {Object.entries(sectionConfig).map(([key, section]) => {
                  const Icon = section.icon;
                  const sectionTabs = section.tabs.filter(tab => availableTabs.includes(tab));
                  
                  if (sectionTabs.length === 0) return null;
                  
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        <span>{section.title}</span>
                      </div>
                      <div className="space-y-1">
                        {sectionTabs.map((tab) => (
                          <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                              activeTab === tab
                                ? "bg-primary text-primary-foreground font-medium"
                                : "hover:bg-accent/50 text-muted-foreground"
                            )}
                          >
                            {tabLabels[tab]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>

          {/* Main Content */}
          <div className="flex-1">
            <Card className="shadow-large border-0 bg-gradient-card backdrop-blur-sm">
              <div className="p-6">
                {children}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}