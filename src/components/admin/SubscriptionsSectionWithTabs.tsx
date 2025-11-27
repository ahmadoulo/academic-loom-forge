import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionPlanManagement } from "./SubscriptionPlanManagement";
import { SchoolSubscriptionsList } from "./SchoolSubscriptionsList";

export function SubscriptionsSectionWithTabs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Abonnements</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les plans d'abonnement et les souscriptions des écoles
        </p>
      </div>

      <Tabs defaultValue="schools" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="schools">Écoles</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="schools" className="mt-6">
          <SchoolSubscriptionsList />
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <SubscriptionPlanManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}