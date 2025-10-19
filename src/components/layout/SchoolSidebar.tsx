import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  School, 
  BookOpen, 
  GraduationCap, 
  Settings,
  ChevronRight,
  FileText,
  Calendar,
  Megaphone,
  CalendarDays,
  Building2
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface SchoolSidebarProps {
  schoolId: string;
}

const menuItems = [
  { 
    title: "Analytics", 
    value: "analytics",
    icon: BarChart3,
    href: "/school"
  },
  { 
    title: "Calendrier", 
    value: "calendar",
    icon: Calendar,
    href: "/school"
  },
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
    title: "Notes", 
    value: "grades",
    icon: BookOpen,
    href: "/school"
  },
  { 
    title: "Présences", 
    value: "attendance",
    icon: Calendar,
    href: "/school"
  },
  { 
    title: "Matières", 
    value: "subjects",
    icon: BookOpen,
    href: "/school"
  },
  { 
    title: "Professeurs", 
    value: "teachers",
    icon: GraduationCap,
    href: "/school"
  },
  { 
    title: "Demandes Document", 
    value: "documents",
    icon: FileText,
    href: "/school"
  },
  { 
    title: "Salles de Cours", 
    value: "classrooms",
    icon: Building2,
    href: "/school"
  },
  { 
    title: "Utilisateurs", 
    value: "users",
    icon: Users,
    href: "/school"
  },
  { 
    title: "Événements", 
    value: "events",
    icon: CalendarDays,
    href: "/school"
  },
  { 
    title: "Annonces", 
    value: "announcements",
    icon: Megaphone,
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
  const location = useLocation();

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
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    asChild
                    isActive={activeTab === item.value}
                    className="w-full justify-start"
                  >
                    {item.href && item.href !== "/school" ? (
                      <a 
                        href={item.href}
                        className="flex items-center gap-3 w-full text-left"
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </a>
                    ) : (
                      <button 
                        onClick={() => onTabChange(item.value)}
                        className="flex items-center gap-3 w-full text-left"
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </button>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}