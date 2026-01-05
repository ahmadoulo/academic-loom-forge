import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, History, Users, GraduationCap, UserCircle } from "lucide-react";
import { StudentNotifications } from "./StudentNotifications";
import { TeacherNotifications } from "./TeacherNotifications";
import { ParentNotifications } from "./ParentNotifications";
import { NotificationHistorySection } from "./NotificationHistorySection";
import { cn } from "@/lib/utils";

interface NotificationsSectionProps {
  schoolId: string;
  canSend?: boolean;
}

type SectionType = "students" | "teachers" | "parents";
type ViewType = "send" | "history";

export function NotificationsSection({ schoolId, canSend = true }: NotificationsSectionProps) {
  const [activeSection, setActiveSection] = useState<SectionType>("students");
  const [activeView, setActiveView] = useState<ViewType>(canSend ? "send" : "history");

  const renderContent = () => {
    if (activeView === "history") {
      return <NotificationHistorySection schoolId={schoolId} />;
    }

    switch (activeSection) {
      case "students":
        return <StudentNotifications schoolId={schoolId} />;
      case "teachers":
        return <TeacherNotifications schoolId={schoolId} />;
      case "parents":
        return <ParentNotifications schoolId={schoolId} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30">
          <Bell className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">Gérer les communications avec les étudiants, enseignants et parents</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Mini Sidebar */}
        <Card className="w-64 p-4 space-y-2 h-fit">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-3 mb-2">ACTION</p>
            {canSend && (
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3",
                  activeView === "send" && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
                onClick={() => setActiveView("send")}
              >
                <Bell className="h-4 w-4 text-primary" />
                Envoyer
              </Button>
            )}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                activeView === "history" && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              onClick={() => setActiveView("history")}
            >
              <History className="h-4 w-4 text-primary" />
              Historique
            </Button>
          </div>

          {activeView === "send" && (
            <>
              <div className="border-t my-3" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-3 mb-2">DESTINATAIRES</p>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    activeSection === "students" && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                  onClick={() => setActiveSection("students")}
                >
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Étudiants
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    activeSection === "teachers" && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                  onClick={() => setActiveSection("teachers")}
                >
                  <Users className="h-4 w-4 text-primary" />
                  Enseignants
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    activeSection === "parents" && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                  onClick={() => setActiveSection("parents")}
                >
                  <UserCircle className="h-4 w-4 text-primary" />
                  Parents
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Main Content */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
