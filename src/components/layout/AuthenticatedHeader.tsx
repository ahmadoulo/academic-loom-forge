import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Settings, LogOut, User } from "lucide-react";

interface AuthenticatedHeaderProps {
  title: string;
  onSettingsClick: () => void;
}

export function AuthenticatedHeader({ title, onSettingsClick }: AuthenticatedHeaderProps) {
  const { profile, signOut } = useAuth();

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
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary-dark rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg lg:text-xl font-bold text-foreground truncate">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
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
              <DropdownMenuItem onClick={signOut}>
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