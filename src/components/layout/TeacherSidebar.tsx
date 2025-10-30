import { useState } from "react";
import { 
  BookOpen, 
  Users, 
  BarChart3,
  GraduationCap,
  Home,
  UserCheck,
  FileText,
  Calendar,
  Megaphone,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Bell
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AcademicYearSidebarSection } from "./AcademicYearSidebarSection";

const menuStructure = [
  { 
    title: "Tableau de bord", 
    value: "dashboard",
    icon: Home,
    href: "/teacher"
  },
  {
    category: "Enseignement",
    icon: GraduationCap,
    items: [
      { 
        title: "Mes Classes", 
        value: "classes",
        icon: Users,
        href: "/teacher"
      },
      { 
        title: "Mes Matières", 
        value: "subjects",
        icon: BookOpen,
        href: "/teacher"
      },
      { 
        title: "Publier un Devoir", 
        value: "assignments",
        icon: FileText,
        href: "/teacher"
      },
    ]
  },
  {
    category: "Suivi",
    icon: ClipboardList,
    items: [
      { 
        title: "Présence", 
        value: "attendance-view",
        icon: UserCheck,
        href: "/teacher"
      },
      { 
        title: "Gestion des Notes", 
        value: "grades",
        icon: BookOpen,
        href: "/teacher"
      },
      { 
        title: "Analytics", 
        value: "analytics",
        icon: BarChart3,
        href: "/teacher"
      },
    ]
  },
  {
    category: "Communication",
    icon: Bell,
    items: [
      { 
        title: "Calendrier", 
        value: "calendar",
        icon: Calendar,
        href: "/teacher"
      },
      { 
        title: "Événements", 
        value: "events",
        icon: CalendarDays,
        href: "/teacher"
      },
      { 
        title: "Annonces", 
        value: "announcements",
        icon: Megaphone,
        href: "/teacher"
      },
    ]
  },
];

export function TeacherSidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { open } = useSidebar();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "Enseignement": true,
    "Suivi": true,
    "Communication": false,
  });

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <Sidebar className={!open ? "w-16" : "w-72"} collapsible="icon">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-primary via-primary-accent to-accent rounded-xl flex items-center justify-center shadow-soft">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {open && (
            <div>
              <span className="font-bold text-lg text-foreground">Eduvate</span>
              <p className="text-xs text-muted-foreground">Professeur</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="p-4">
        <div className="space-y-8">
          {menuStructure.map((item, index) => {
            // Item simple sans catégorie
            if ('value' in item) {
              return (
                <div key={item.value} className="space-y-1">
                  <button
                    onClick={() => onTabChange(item.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === item.value
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'hover:bg-secondary text-foreground hover:translate-x-1'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {open && <span>{item.title}</span>}
                  </button>
                </div>
              );
            }

            // Catégorie avec sous-menu
            const isOpen = openCategories[item.category] ?? false;
            const CategoryIcon = item.icon;

            return (
              <div key={item.category} className="space-y-3">
                <button
                  onClick={() => toggleCategory(item.category)}
                  className="w-full flex items-center gap-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CategoryIcon className="h-4 w-4" />
                  {open && (
                    <>
                      <span className="flex-1 text-left">{item.category}</span>
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                      />
                    </>
                  )}
                </button>
                {isOpen && (
                  <div className="space-y-1">
                    {item.items.map(subItem => (
                      <button
                        key={subItem.value}
                        onClick={() => onTabChange(subItem.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          activeTab === subItem.value
                            ? 'bg-primary text-primary-foreground shadow-soft'
                            : 'hover:bg-secondary text-foreground hover:translate-x-1'
                        }`}
                      >
                        <subItem.icon className="h-4 w-4 shrink-0" />
                        {open && <span>{subItem.title}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 pt-6 border-t border-border/50">
          <AcademicYearSidebarSection context="teacher" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}