import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell } from "lucide-react";
import { StudentNotifications } from "./StudentNotifications";
import { TeacherNotifications } from "./TeacherNotifications";
import { ParentNotifications } from "./ParentNotifications";

interface NotificationsSectionProps {
  schoolId: string;
}

export function NotificationsSection({ schoolId }: NotificationsSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Envoyer des notifications par email aux étudiants et professeurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="students">Étudiants</TabsTrigger>
              <TabsTrigger value="teachers">Professeurs</TabsTrigger>
              <TabsTrigger value="parents">Parents</TabsTrigger>
              <TabsTrigger value="staff" disabled>
                Staff École
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="mt-6">
              <StudentNotifications schoolId={schoolId} />
            </TabsContent>

            <TabsContent value="teachers" className="mt-6">
              <TeacherNotifications schoolId={schoolId} />
            </TabsContent>

            <TabsContent value="parents" className="mt-6">
              <ParentNotifications schoolId={schoolId} />
            </TabsContent>

            <TabsContent value="staff" className="mt-6">
              <div className="text-center text-muted-foreground py-8">
                Fonctionnalité en développement
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
