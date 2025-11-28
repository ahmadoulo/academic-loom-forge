import { useState } from "react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSchools } from "@/hooks/useSchools";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { EditSubscriptionDialog } from "./EditSubscriptionDialog";

export function SubscriptionsSection() {
  const { subscriptions, loading } = useSubscriptions();
  const { schools } = useSchools();
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const getSchoolName = (schoolId: string) => {
    const school = schools.find((s) => s.id === schoolId);
    return school?.name || "École inconnue";
  };

  const getStatusBadge = (status: string, endDate: string) => {
    const daysRemaining = Math.ceil(
      (new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (status === "expired") {
      return <Badge variant="destructive">Expiré</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="secondary">Annulé</Badge>;
    }
    if (daysRemaining <= 7) {
      return <Badge variant="destructive">Expire bientôt ({daysRemaining}j)</Badge>;
    }
    if (daysRemaining <= 30) {
      return <Badge className="bg-orange-500">Expire dans {daysRemaining}j</Badge>;
    }
    return <Badge variant="default">Actif ({daysRemaining}j)</Badge>;
  };

  const handleEdit = (subscription: any) => {
    setSelectedSubscription(subscription);
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">Chargement des abonnements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "active" || sub.status === "trial"
  );
  const expiringSoon = subscriptions.filter((sub) => {
    const daysRemaining = Math.ceil(
      (new Date(sub.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysRemaining <= 30 && daysRemaining > 0;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Écoles avec abonnement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirent Bientôt</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoon.length}</div>
            <p className="text-xs text-muted-foreground">Dans les 30 prochains jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Abonnements</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Toutes écoles</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Abonnements</CardTitle>
          <CardDescription>
            Gérez les abonnements et périodes d'essai pour chaque école
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>École</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucun abonnement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      {getSchoolName(subscription.school_id)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{subscription.plan_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subscription.status, subscription.end_date)}
                    </TableCell>
                    <TableCell>
                      {new Date(subscription.start_date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      {new Date(subscription.end_date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      {subscription.amount ? `${subscription.amount} ${subscription.currency}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(subscription)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedSubscription && (
        <EditSubscriptionDialog
          subscription={selectedSubscription}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => {
            setShowEditDialog(false);
            setSelectedSubscription(null);
          }}
        />
      )}
    </div>
  );
}
