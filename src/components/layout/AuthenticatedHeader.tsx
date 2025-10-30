import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Settings, User, Menu, School, Users, HelpCircle, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AcademicYearDisplay } from "@/components/layout/AcademicYearDisplay";
import { SemesterDisplay } from "@/components/layout/SemesterDisplay";
import { Badge } from "@/components/ui/badge";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuItem {
  title: string;
  value: string;
  icon: any;
  description?: string;
}

interface AuthenticatedHeaderProps {
  title: string;
  onSettingsClick: () => void;
  showMobileMenu?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  menuItems?: MenuItem[];
  schoolName?: string;
  schoolLogoUrl?: string;
  userRole?: 'teacher' | 'student' | 'admin';
  sidebarContent?: React.ReactNode;
}

export function AuthenticatedHeader({ 
  title, 
  onSettingsClick, 
  showMobileMenu = false, 
  activeTab, 
  onTabChange,
  menuItems: customMenuItems,
  schoolName,
  schoolLogoUrl,
  userRole,
  sidebarContent
}: AuthenticatedHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Mock user pour l'accès libre
  const profile = {
    first_name: "Admin",
    last_name: "Global",
    email: "admin@eduvate.com",
    role: "global_admin"
  };

  const defaultMenuItems = [
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

  const menuItems = customMenuItems || defaultMenuItems;

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      global_admin: { label: "Admin Global", className: "bg-primary/10 text-primary" },
      school_admin: { label: "Admin École", className: "bg-blue-500/10 text-blue-600" },
      teacher: { label: "Professeur", className: "bg-green-500/10 text-green-600" },
      student: { label: "Étudiant", className: "bg-orange-500/10 text-orange-600" },
      parent: { label: "Parent", className: "bg-indigo-500/10 text-indigo-600" },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, className: "" };
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
  };

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
          {showMobileMenu && sidebarContent && (
            <div className="lg:hidden flex-shrink-0">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
            {sidebarContent}
          </MobileSidebar>
          
          {/* Logo and Branding */}
          <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
            {/* User info and role badge */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 lg:h-9 lg:w-9 bg-gradient-to-br from-primary via-primary to-primary-dark rounded-lg flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-4 w-4 lg:h-5 lg:w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm lg:text-base font-bold text-foreground truncate">
                  {title}
                </h1>
                {schoolName && userRole && (
                  <p className="text-xs text-muted-foreground truncate hidden sm:block">
                    {userRole === 'teacher' ? 'Professeur' : userRole === 'student' ? 'Étudiant' : 'Administrateur'}
                  </p>
                )}
              </div>
            </div>
            
            {/* School Logo and Name - Only for teacher and student */}
            {schoolName && (userRole === 'teacher' || userRole === 'student' || userRole === 'admin') && (
              <>
                <div className="hidden lg:block h-8 w-px bg-border flex-shrink-0" />
                <div className="hidden lg:flex items-center gap-2 lg:gap-3">
                  {schoolLogoUrl ? (
                    <img 
                      src={schoolLogoUrl} 
                      alt={schoolName} 
                      className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg object-cover ring-2 ring-primary/10 shadow-md"
                    />
                  ) : (
                    <div className="h-10 w-10 lg:h-12 lg:w-12 bg-gradient-to-br from-primary/80 to-primary rounded-lg flex items-center justify-center shadow-md">
                      <School className="h-5 w-5 lg:h-6 lg:w-6 text-primary-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {userRole === 'admin' ? 'Administration' : 'École'}
                    </p>
                    <p className="text-sm font-bold text-foreground truncate max-w-[200px]">
                      {schoolName}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          <AcademicYearDisplay />
          <SemesterDisplay />
          <div className="hidden sm:block">
            {profile?.role && getRoleBadge(profile.role)}
          </div>
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.email}
                  </p>
                </div>
              </div>
              <div className="sm:hidden px-2 pb-2">
                {profile?.role && getRoleBadge(profile.role)}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => console.log('Déconnexion simulée')}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}