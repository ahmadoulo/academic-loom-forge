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
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent-light p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Paramètres
          </h1>
          <p className="text-muted-foreground text-base">
            Gérez votre compte et les préférences de votre organisation
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-72 shrink-0">
            <Card className="shadow-soft border border-border bg-card/80 backdrop-blur-sm sticky top-6">
              <ScrollArea className="h-auto lg:h-[calc(100vh-12rem)]">
                <div className="p-6 space-y-8">
                  {Object.entries(sectionConfig).map(([key, section]) => {
                    const Icon = section.icon;
                    const sectionTabs = section.tabs.filter(tab => availableTabs.includes(tab));
                    
                    if (sectionTabs.length === 0) return null;
                    
                    return (
                      <div key={key} className="space-y-3">
                        <div className="flex items-center gap-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <Icon className="h-4 w-4" />
                          <span>{section.title}</span>
                        </div>
                        <div className="space-y-1">
                          {sectionTabs.map((tab) => (
                            <button
                              key={tab}
                              onClick={() => onTabChange(tab)}
                              className={cn(
                                "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                activeTab === tab
                                  ? "bg-primary text-primary-foreground shadow-soft"
                                  : "hover:bg-secondary text-foreground hover:translate-x-1"
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
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Card className="shadow-soft border border-border bg-card/80 backdrop-blur-sm">
              <div className="p-6 md:p-8">
                {children}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}