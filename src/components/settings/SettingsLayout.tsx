import { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { User, Users, Shield, Bell, Palette, Database } from "lucide-react";

interface SettingsLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (value: string) => void;
  availableTabs: string[];
}

export function SettingsLayout({ children, activeTab, onTabChange, availableTabs }: SettingsLayoutProps) {
  const tabConfig = {
    profile: { label: "Profil", icon: User },
    users: { label: "Utilisateurs", icon: Users },
    roles: { label: "Rôles & Permissions", icon: Shield },
    notifications: { label: "Notifications", icon: Bell },
    appearance: { label: "Apparence", icon: Palette },
    system: { label: "Système", icon: Database },
  };

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

        <Card className="shadow-large border-0 bg-gradient-card backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <div className="border-b border-border/50 px-6 pt-6">
              <TabsList className="grid w-full max-w-4xl grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-muted/30">
                {availableTabs.map((tab) => {
                  const config = tabConfig[tab as keyof typeof tabConfig];
                  const Icon = config.icon;
                  return (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{config.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            
            <div className="p-6">
              {children}
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}