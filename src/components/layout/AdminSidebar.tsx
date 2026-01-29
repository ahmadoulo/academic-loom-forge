import { 
  School, 
  Settings,
  HelpCircle,
  LayoutDashboard,
  CreditCard,
  ChevronRight,
  Sparkles
} from "lucide-react";
import eduvateLogo from "@/assets/eduvate-logo.png";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent as SidebarContentUI,
  SidebarGroup,
  SidebarGroupContent,
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
    title: "Vue d'ensemble", 
    value: "dashboard",
    icon: LayoutDashboard,
  },
  { 
    title: "Établissements", 
    value: "schools",
    icon: School,
  },
  { 
    title: "Abonnements", 
    value: "subscriptions",
    icon: CreditCard,
  },
  { 
    title: "Paramètres", 
    value: "settings",
    icon: Settings,
  },
  { 
    title: "Support", 
    value: "support",
    icon: HelpCircle,
  },
];

function SidebarContentComponent({ activeTab, onTabChange, isMobile = false }: AdminSidebarProps & { isMobile?: boolean }) {
  const { open } = useSidebar();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      {/* Logo Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-11 w-11 rounded-xl bg-white p-1.5 shadow-lg shadow-primary/20">
              <img src={eduvateLogo} alt="Eduvate" className="h-full w-full object-contain" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>
          {(open || isMobile) && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white tracking-tight">
                EduVate
              </span>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">Admin Console</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <SidebarContentUI className="flex-1 px-3 py-4">
        <SidebarGroup>
          {(open || isMobile) && (
            <div className="px-3 mb-3">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Navigation
              </span>
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = activeTab === item.value;
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive}
                      className={cn(
                        "w-full transition-all duration-200 rounded-xl",
                        isActive 
                          ? "bg-gradient-to-r from-primary/20 to-primary/10 text-white shadow-lg shadow-primary/10" 
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <button 
                        onClick={() => onTabChange(item.value)}
                        className="flex items-center gap-3 w-full text-left px-3 py-2.5"
                      >
                        <div className={cn(
                          "p-2 rounded-lg transition-all duration-200",
                          isActive 
                            ? "bg-primary text-white shadow-md shadow-primary/30" 
                            : "bg-slate-800 text-slate-400 group-hover:text-white"
                        )}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        {(open || isMobile) && (
                          <>
                            <span className={cn(
                              "flex-1 text-sm font-medium",
                              isActive ? "text-white" : "text-slate-300"
                            )}>
                              {item.title}
                            </span>
                            {isActive && (
                              <ChevronRight className="h-4 w-4 text-primary" />
                            )}
                          </>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContentUI>

      {/* Footer with Academic Year */}
      <div className="mt-auto p-4 border-t border-white/10">
        <AcademicYearSidebarSection context="admin" />
      </div>
    </div>
  );
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <div className="hidden md:block">
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarContentComponent activeTab={activeTab} onTabChange={onTabChange} />
      </Sidebar>
    </div>
  );
}
