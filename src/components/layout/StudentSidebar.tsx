import { 
  BookOpen, 
  Home,
  GraduationCap,
  FileText,
  ClipboardList,
  Calendar,
  Megaphone,
  CalendarDays
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
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { 
    title: "Accueil", 
    value: "accueil",
    icon: Home,
    href: "/student"
  },
  { 
    title: "Calendrier", 
    value: "calendar",
    icon: Calendar,
    href: "/student"
  },
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
  { 
    title: "Demande Document", 
    value: "documents",
    icon: FileText,
    href: "/student"
  },
  { 
    title: "Événements", 
    value: "events",
    icon: CalendarDays,
    href: "/events"
  },
  { 
    title: "Annonces", 
    value: "announcements",
    icon: Megaphone,
    href: "/announcements"
  },
];

export function StudentSidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { open } = useSidebar();

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
                    {item.href && item.href !== "/student" ? (
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