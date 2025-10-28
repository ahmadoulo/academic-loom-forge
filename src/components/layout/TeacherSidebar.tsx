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
    <Sidebar className={!open ? "w-16" : "w-64"} collapsible="icon">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {open && (
            <span className="font-bold text-lg">Eduvate</span>
          )}
        </div>
      </div>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuStructure.map((item, index) => {
                // Item simple sans catégorie
                if ('value' in item) {
                  return (
                    <SidebarMenuItem key={item.value}>
                      <SidebarMenuButton 
                        asChild
                        isActive={activeTab === item.value}
                        className="w-full justify-start"
                      >
                        <button 
                          onClick={() => onTabChange(item.value)}
                          className="flex items-center gap-3 w-full text-left"
                        >
                          <item.icon className="h-4 w-4" />
                          {open && <span>{item.title}</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Catégorie avec sous-menu
                const isOpen = openCategories[item.category] ?? false;

                return (
                  <Collapsible
                    key={item.category}
                    open={isOpen}
                    onOpenChange={() => toggleCategory(item.category)}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full">
                          <item.icon className="h-4 w-4" />
                          {open && (
                            <>
                              <span className="flex-1">{item.category}</span>
                              <ChevronDown 
                                className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                              />
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map(subItem => (
                            <SidebarMenuSubItem key={subItem.value}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={activeTab === subItem.value}
                              >
                                <button 
                                  onClick={() => onTabChange(subItem.value)}
                                  className="flex items-center gap-3 w-full text-left"
                                >
                                  <subItem.icon className="h-4 w-4" />
                                  {open && <span>{subItem.title}</span>}
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mt-auto pt-4 border-t">
          <AcademicYearSidebarSection />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}