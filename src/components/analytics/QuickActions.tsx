import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, BookOpen, GraduationCap, School, Zap } from "lucide-react";

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

export function QuickActions({ actions, title = "Accès rapide" }: QuickActionsProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {actions.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune action disponible</p>
            </div>
          ) : (
            actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  onClick={action.onClick}
                  className="flex items-center justify-start gap-3 h-auto p-4 text-left hover:shadow-md transition-all duration-200 border-2 hover:border-primary/30"
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </Button>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}