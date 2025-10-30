import { useState } from "react";
import { 
  BookOpen, 
  Home,
  GraduationCap,
  FileText,
  ClipboardList,
  Calendar,
  Megaphone,
  CalendarDays,
  ChevronDown,
  Bell,
  BookMarked
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
    title: "Accueil", 
    value: "accueil",
    icon: Home,
    href: "/student"
  },
  {
    category: "Scolarité",
    icon: BookMarked,
    items: [
      { 
        title: "Mes Notes", 
        value: "notes",
        icon: BookOpen,
        href: "/student"
      },
      { 
        title: "Devoirs", 
        value: "devoirs",
        icon: ClipboardList,
        href: "/student"
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
        href: "/student"
      },
      { 
        title: "Événements", 
        value: "events",
        icon: CalendarDays,
        href: "/student"
      },
      { 
        title: "Annonces", 
        value: "announcements",
        icon: Megaphone,
        href: "/student"
      },
    ]
  },
  { 
    title: "Demande Document", 
    value: "documents",
    icon: FileText,
    href: "/student"
  },
];

export function StudentSidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { open } = useSidebar();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "Scolarité": true,
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
              <p className="text-xs text-muted-foreground">Étudiant</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="p-4 overflow-y-auto">
        <div className="space-y-6">
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
                    {open && <span className="truncate">{item.title}</span>}
                  </button>
                </div>
              );
            }

            // Catégorie avec sous-menu
            const isOpen = openCategories[item.category] ?? false;
            const CategoryIcon = item.icon;

            return (
              <div key={item.category} className="space-y-2">
                <button
                  onClick={() => toggleCategory(item.category)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wide text-foreground/90 hover:text-foreground transition-colors"
                >
                  <CategoryIcon className="h-4 w-4 shrink-0" />
                  {open && (
                    <>
                      <span className="flex-1 text-left truncate">{item.category}</span>
                      <ChevronDown 
                        className={`h-3 w-3 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                      />
                    </>
                  )}
                </button>
                {isOpen && (
                  <div className="space-y-1 pl-2">
                    {item.items.map(subItem => (
                      <button
                        key={subItem.value}
                        onClick={() => onTabChange(subItem.value)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          activeTab === subItem.value
                            ? 'bg-primary text-primary-foreground shadow-soft'
                            : 'hover:bg-secondary text-foreground hover:translate-x-1'
                        }`}
                      >
                        <subItem.icon className="h-4 w-4 shrink-0" />
                        {open && <span className="truncate">{subItem.title}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 pt-6 border-t border-border/50">
          <AcademicYearSidebarSection context="student" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}