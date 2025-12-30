import { useState } from "react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Settings, User, Menu, School, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AcademicYearDisplay } from "@/components/layout/AcademicYearDisplay";
import { SemesterDisplay } from "@/components/layout/SemesterDisplay";
import { Badge } from "@/components/ui/badge";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const navigate = useNavigate();
  const { user, primaryRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  // Clone sidebarContent with mobile props if it exists
  const mobileSidebarContent = sidebarContent && React.isValidElement(sidebarContent)
    ? React.cloneElement(sidebarContent as React.ReactElement<any>, {
        isMobile: true,
        onClose: handleCloseMobileMenu
      })
    : sidebarContent;
  
  // Get user display info from auth context
  const displayName = user ? `${user.first_name} ${user.last_name}` : "Utilisateur";
  const displayEmail = user?.email || "";
  const displayInitials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : "U";
  const displayRole = primaryRole || "user";

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      global_admin: { label: "Admin Global", className: "bg-primary/10 text-primary border-primary/20" },
      admin: { label: "Admin Global", className: "bg-primary/10 text-primary border-primary/20" },
      school_admin: { label: "Admin École", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      teacher: { label: "Professeur", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
      student: { label: "Étudiant", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
      parent: { label: "Parent", className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
    };
    
    const config = roleConfig[role] || { label: role, className: "bg-muted text-muted-foreground" };
    return <Badge variant="outline" className={`${config.className} font-medium`}>{config.label}</Badge>;
  };

  const handleLogout = () => {
    logout();
  };

  const handleProfileClick = () => {
    navigate('/profile');
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
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
          {mobileSidebarContent}
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
            {getRoleBadge(displayRole)}
          </div>
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {displayEmail}
                  </p>
                </div>
              </div>
              <div className="sm:hidden px-2 pb-2">
                {getRoleBadge(displayRole)}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
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