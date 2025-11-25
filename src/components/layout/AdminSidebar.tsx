import { 
  School, 
  Settings,
  HelpCircle,
  LayoutDashboard,
  CreditCard,
  GraduationCap
} from "lucide-react";

import {
  Sidebar,
  SidebarContent as SidebarContentUI,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AcademicYearSidebarSection } from "./AcademicYearSidebarSection";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { 
    title: "Tableau de bord", 
    value: "dashboard",
    icon: LayoutDashboard,
    description: "Vue d'ensemble",
    href: "/admin"
  },
  { 
    title: "Écoles", 
    value: "schools",
    icon: School,
    description: "Gérer les établissements",
    href: "/admin"
  },
  { 
    title: "Abonnements", 
    value: "subscriptions",
    icon: CreditCard,
    description: "Plans et paiements",
    href: "/admin"
  },
  { 
    title: "Paramètres", 
    value: "settings",
    icon: Settings,
    description: "Utilisateurs et rôles",
    href: "/admin"
  },
  { 
    title: "Support Écoles", 
    value: "support",
    icon: HelpCircle,
    description: "Assistance utilisateurs",
    href: "/admin"
  },
];

function SidebarContentComponent({ activeTab, onTabChange, isMobile = false }: AdminSidebarProps & { isMobile?: boolean }) {
  const { open } = useSidebar();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          {(open || isMobile) && (
            <div>
              <span className="font-bold text-lg text-foreground">
                Eduvate
              </span>
              <p className="text-xs text-muted-foreground">Administration Globale</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContentUI className="flex-1 p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    asChild
                    isActive={activeTab === item.value}
                    className="w-full justify-start hover:bg-accent transition-colors rounded-lg"
                  >
                    {item.href && item.href !== "/admin" ? (
                      <a 
                        href={item.href}
                        className="flex items-center gap-3 w-full text-left px-3 py-2.5"
                      >
                        <div className={`p-1.5 rounded-md ${activeTab === item.value ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        {(open || isMobile) && (
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-medium">{item.title}</span>
                            <span className="text-xs text-muted-foreground truncate block">{item.description}</span>
                          </div>
                        )}
                      </a>
                    ) : (
                      <button 
                        onClick={() => onTabChange(item.value)}
                        className="flex items-center gap-3 w-full text-left px-3 py-2.5"
                      >
                        <div className={`p-1.5 rounded-md ${activeTab === item.value ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        {(open || isMobile) && (
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-medium">{item.title}</span>
                            <span className="text-xs text-muted-foreground truncate block">{item.description}</span>
                          </div>
                        )}
                      </button>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContentUI>

      <div className="mt-auto p-4 border-t">
        <AcademicYearSidebarSection context="admin" />
      </div>
    </div>
  );
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <div className="hidden md:block">
      <Sidebar collapsible="icon">
        <SidebarContentComponent activeTab={activeTab} onTabChange={onTabChange} />
      </Sidebar>
    </div>
  );
}