import { useState } from "react";
import { 
  School, 
  Users, 
  Settings,
  HelpCircle,
  ChevronRight,
  Menu,
  X
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { 
    title: "Écoles", 
    value: "schools",
    icon: School,
    description: "Gérer les établissements"
  },
  { 
    title: "Paramètres", 
    value: "settings",
    icon: Settings,
    description: "Utilisateurs et rôles"
  },
  { 
    title: "Support Écoles", 
    value: "support",
    icon: HelpCircle,
    description: "Assistance utilisateurs"
  },
];

function SidebarContentComponent({ activeTab, onTabChange, isMobile = false }: AdminSidebarProps & { isMobile?: boolean }) {
  const { open } = useSidebar();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center">
            <School className="h-5 w-5 text-primary-foreground" />
          </div>
          {(open || isMobile) && (
            <div>
              <span className="font-bold text-lg">Admin Panel</span>
              <p className="text-xs text-muted-foreground">Gestion système</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContentUI className="flex-1 p-4">
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
                    <button 
                      onClick={() => onTabChange(item.value)}
                      className="flex items-center gap-3 w-full text-left"
                    >
                      <item.icon className="h-4 w-4" />
                      {(open || isMobile) && (
                        <div className="flex-1">
                          <span className="block">{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContentUI>
    </div>
  );
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { open } = useSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar className={!open ? "w-16" : "w-64"} collapsible="icon">
          <SidebarContentComponent activeTab={activeTab} onTabChange={onTabChange} />
        </Sidebar>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="m-4">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContentComponent activeTab={activeTab} onTabChange={onTabChange} isMobile />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}