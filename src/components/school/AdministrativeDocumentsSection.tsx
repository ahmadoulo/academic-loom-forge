import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileStack, Users, Settings } from "lucide-react";
import { DocumentTypesManagement } from "./administrative-documents/DocumentTypesManagement";
import { StudentDocumentsTracking } from "./administrative-documents/StudentDocumentsTracking";

interface AdministrativeDocumentsSectionProps {
  schoolId: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function AdministrativeDocumentsSection({
  schoolId,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: AdministrativeDocumentsSectionProps) {
  const [activeTab, setActiveTab] = useState("tracking");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Suivi des Documents Administratifs</h2>
        <p className="text-muted-foreground">
          Gérez et suivez les documents administratifs des étudiants par cycle
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Suivi Étudiants
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Types de Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-4">
          <StudentDocumentsTracking 
            schoolId={schoolId} 
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <DocumentTypesManagement
            schoolId={schoolId}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
