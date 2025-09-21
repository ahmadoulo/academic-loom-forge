import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, BookOpen, GraduationCap, School } from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  variant?: "default" | "secondary" | "outline";
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

export function QuickActions({ actions, title = "Actions rapides" }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2 text-center"
                onClick={action.onClick}
              >
                <Icon className="h-5 w-5" />
                <div>
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}