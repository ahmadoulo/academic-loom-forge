import { useState } from "react";
import { 
  BarChart3, 
  Users, 
  School, 
  BookOpen, 
  GraduationCap, 
  Settings,
  ChevronDown,
  FileText,
  Calendar,
  Megaphone,
  CalendarDays,
  Building2,
  Award,
  ClipboardList,
  Clock,
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

interface SchoolSidebarProps {
  schoolId: string;
}

const menuStructure = [
  { 
    title: "Analytics", 
    value: "analytics",
    icon: BarChart3,
    href: "/school"
  },
  {
    category: "Gestion académique",
    icon: GraduationCap,
    items: [
      { 
        title: "Étudiants", 
        value: "students",
        icon: Users,
        href: "/school"
      },
      { 
        title: "Classes", 
        value: "classes",
        icon: School,
        href: "/school"
      },
      { 
        title: "Professeurs", 
        value: "teachers",
        icon: GraduationCap,
        href: "/school"
      },
      { 
        title: "Matières", 
        value: "subjects",
        icon: BookOpen,
        href: "/school"
      },
      { 
        title: "Utilisateurs", 
        value: "users",
        icon: Users,
        href: "/school"
      },
    ]
  },
  {
    category: "Suivi pédagogique",
    icon: ClipboardList,
    items: [
      { 
        title: "Présences", 
        value: "attendance",
        icon: Clock,
        href: "/school"
      },
      { 
        title: "Notes", 
        value: "grades",
        icon: BookOpen,
        href: "/school"
      },
      { 
        title: "Bulletin", 
        value: "bulletin",
        icon: Award,
        href: "/school"
      },
    ]
  },
  {
    category: "Organisation",
    icon: Building2,
    items: [
      { 
        title: "Emploi du Temps", 
        value: "timetable",
        icon: Calendar,
        href: "/school"
      },
      { 
        title: "Salles de Cours", 
        value: "classrooms",
        icon: Building2,
        href: "/school"
      },
      { 
        title: "Calendrier", 
        value: "calendar",
        icon: Calendar,
        href: "/school"
      },
    ]
  },
  {
    category: "Communication",
    icon: Bell,
    items: [
      { 
        title: "Annonces", 
        value: "announcements",
        icon: Megaphone,
        href: "/school"
      },
      { 
        title: "Événements", 
        value: "events",
        icon: CalendarDays,
        href: "/school"
      },
      { 
        title: "Demandes Document", 
        value: "documents",
        icon: FileText,
        href: "/school"
      },
    ]
  },
  { 
    title: "Nouvelle Année", 
    value: "year-transition",
    icon: CalendarDays,
    href: "/school"
  },
  { 
    title: "Paramètres", 
    value: "settings",
    icon: Settings,
    href: "/school"
  },
];

export function SchoolSidebar({ schoolId, activeTab, onTabChange }: SchoolSidebarProps & { activeTab: string; onTabChange: (tab: string) => void }) {
  const { open } = useSidebar();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "Gestion académique": true,
    "Suivi pédagogique": true,
    "Organisation": false,
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
            <School className="h-5 w-5 text-primary-foreground" />
          </div>
          {open && (
            <span className="font-bold text-lg">Eduvate</span>
          )}
        </div>
      </div>

      <SidebarContent className="p-4">
        <div className="mb-4">
          <AcademicYearSidebarSection />
        </div>
        
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
      </SidebarContent>
    </Sidebar>
  );
}