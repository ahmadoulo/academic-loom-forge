import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  School, 
  GraduationCap, 
  BookOpen,
  Zap,
  ArrowRight
} from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  variant?: "default" | "secondary" | "outline";
}

interface SchoolQuickActionsProps {
  actions: QuickAction[];
}

export function SchoolQuickActions({ actions }: SchoolQuickActionsProps) {
  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">Actions Rapides</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const isDefault = action.variant === "default";
            return (
              <Button
                key={index}
                variant={isDefault ? "default" : "outline"}
                onClick={action.onClick}
                className={`h-auto p-4 flex flex-col items-center gap-2 text-center hover:shadow-md transition-all ${
                  isDefault ? '' : 'hover:border-primary/50'
                }`}
              >
                <div className={`p-2 rounded-lg ${isDefault ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}>
                  <Icon className={`h-5 w-5 ${isDefault ? 'text-primary-foreground' : 'text-primary'}`} />
                </div>
                <span className="text-xs font-medium">{action.title}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
