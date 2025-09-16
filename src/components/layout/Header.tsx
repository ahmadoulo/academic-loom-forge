import { GraduationCap, Settings, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  userRole: 'admin' | 'school' | 'teacher';
  schoolName?: string;
}

export const Header = ({ title, userRole, schoolName }: HeaderProps) => {
  const getRoleIcon = () => {
    switch (userRole) {
      case 'admin':
        return <Settings className="h-6 w-6" />;
      case 'school':
        return <Users className="h-6 w-6" />;
      case 'teacher':
        return <BookOpen className="h-6 w-6" />;
      default:
        return <GraduationCap className="h-6 w-6" />;
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'admin':
        return 'Administrateur Global';
      case 'school':
        return `Administration - ${schoolName}`;
      case 'teacher':
        return `Professeur - ${schoolName}`;
      default:
        return 'Utilisateur';
    }
  };

  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary">
              <GraduationCap className="h-8 w-8" />
              <span className="text-xl font-bold">AcademicPro</span>
            </div>
            <div className="hidden md:block h-6 w-px bg-border" />
            <h1 className="hidden md:block text-xl font-semibold text-foreground">
              {title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getRoleIcon()}
              <span className="hidden md:inline">{getRoleLabel()}</span>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};