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
  Bell,
  Search,
  PanelLeftClose,
  PanelLeft,
  Pin,
  PinOff
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
    icon: Home
  },
  {
    category: "Enseignement",
    icon: GraduationCap,
    items: [
      { 
        title: "Mes Classes", 
        value: "classes",
        icon: Users
      },
      { 
        title: "Mes Matières", 
        value: "subjects",
        icon: BookOpen
      },
      { 
        title: "Publier un Devoir", 
        value: "assignments",
        icon: FileText
      },
      { 
        title: "Documents Examen", 
        value: "exams",
        icon: FileText
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
        icon: UserCheck
      },
      { 
        title: "Gestion des Notes", 
        value: "grades",
        icon: BookOpen
      },
      { 
        title: "Analytics", 
        value: "analytics",
        icon: BarChart3
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
        icon: Calendar
      },
      { 
        title: "Événements", 
        value: "events",
        icon: CalendarDays
      },
      { 
        title: "Annonces", 
        value: "announcements",
        icon: Megaphone
      },
    ]
  },
];

export function TeacherSidebar({ activeTab, onTabChange, isMobile = false, onClose }: { activeTab: string; onTabChange: (tab: string) => void; isMobile?: boolean; onClose?: () => void }) {
  const { open, setOpen } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPinned, setIsPinned] = useState(true);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "Enseignement": true,
    "Suivi": true,
    "Communication": false,
  });

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleMouseEnter = () => {
    if (!isPinned) {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setOpen(false);
    }
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  const filteredMenuStructure = menuStructure.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if ('value' in item) {
      return item.title.toLowerCase().includes(query);
    }
    return item.category.toLowerCase().includes(query) || 
           item.items.some(subItem => subItem.title.toLowerCase().includes(query));
  });

  // Contenu du sidebar
  const sidebarContent = (
    <div className="flex flex-col h-full bg-background">
      <div className={`border-b border-border/50 bg-card transition-all duration-200 ${!open && !isMobile ? "p-2" : "p-4"}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 bg-gradient-to-br from-primary via-primary-accent to-accent rounded-xl flex items-center justify-center shadow-md shrink-0">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            {(open || isMobile) && (
              <div className="min-w-0 flex-1">
                <span className="font-bold text-lg text-foreground block truncate">Eduvate</span>
                <p className="text-xs text-muted-foreground truncate">Professeur</p>
              </div>
            )}
          </div>
          {(open || isMobile) && !isMobile && (
            <div className="flex items-center gap-1">
              <button
                onClick={togglePin}
                className={`p-2 hover:bg-secondary rounded-lg transition-colors shrink-0 ${isPinned ? 'bg-primary/10 text-primary' : ''}`}
                title={isPinned ? "Désépingler" : "Épingler"}
              >
                {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setOpen(!open)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors shrink-0"
                title="Réduire"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        
        {!open && !isMobile && (
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="Développer"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {(open || isMobile) && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
      </div>

      <div className={`overflow-y-auto flex-1 transition-all duration-200 ${!open && !isMobile ? "p-2" : "p-4"}`}>
        <div className="space-y-4">
          {filteredMenuStructure.map((item, index) => {
            if ('value' in item) {
              return (
                <div key={item.value}>
                  <button
                    onClick={() => {
                      onTabChange(item.value);
                      if (isMobile && onClose) onClose();
                    }}
                    className={`w-full flex items-center ${!open && !isMobile ? 'justify-center' : 'justify-start'} gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      !open && !isMobile ? "p-3" : "px-4 py-3"
                    } ${
                      activeTab === item.value
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'hover:bg-secondary text-foreground'
                    }`}
                    title={!open && !isMobile ? item.title : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {(open || isMobile) && <span className="truncate">{item.title}</span>}
                  </button>
                </div>
              );
            }

            const isOpen = openCategories[item.category] ?? false;
            const CategoryIcon = item.icon;

            return (
              <div key={item.category} className="space-y-2">
                {!open && !isMobile ? (
                  <>
                    {item.items.map(subItem => (
                      <button
                        key={subItem.value}
                        onClick={() => {
                          onTabChange(subItem.value);
                          if (isMobile && onClose) onClose();
                        }}
                        className={`w-full flex items-center justify-center p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          activeTab === subItem.value
                            ? 'bg-primary text-primary-foreground shadow-soft'
                            : 'hover:bg-secondary text-foreground'
                        }`}
                        title={subItem.title}
                      >
                        <subItem.icon className="h-5 w-5 shrink-0" />
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => toggleCategory(item.category)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wide text-foreground/90 hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                    >
                      <CategoryIcon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left truncate">{item.category}</span>
                      <ChevronDown 
                        className={`h-3 w-3 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                      />
                    </button>
                    {isOpen && (
                      <div className="space-y-1 pl-2 animate-accordion-down">
                        {item.items.map(subItem => (
                          <button
                            key={subItem.value}
                            onClick={() => {
                              onTabChange(subItem.value);
                              if (isMobile && onClose) onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              activeTab === subItem.value
                                ? 'bg-primary text-primary-foreground shadow-soft'
                                : 'hover:bg-secondary text-foreground hover:translate-x-0.5'
                            }`}
                          >
                            <subItem.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{subItem.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 pt-6 border-t border-border/50">
          <AcademicYearSidebarSection context="teacher" />
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return sidebarContent;
  }

  return (
    <Sidebar 
      className={`${!open ? "w-16" : "w-64"} hidden lg:flex`} 
      collapsible="icon"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {sidebarContent}
    </Sidebar>
  );
}