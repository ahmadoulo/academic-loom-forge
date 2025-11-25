import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addMonths, addYears } from "date-fns";

interface EditSubscriptionDialogProps {
  subscription: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditSubscriptionDialog({ 
  subscription, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditSubscriptionDialogProps) {
  const { plans } = useSubscriptionPlans();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    plan_type: subscription?.plan_type || 'basic',
    duration: subscription?.duration || '1_month',
    amount: subscription?.amount || 0,
    currency: subscription?.currency || 'MAD',
    auto_renew: subscription?.auto_renew || false,
    payment_method: subscription?.payment_method || 'bank_transfer'
  });

  useEffect(() => {
    if (subscription) {
      setFormData({
        plan_type: subscription.plan_type,
        duration: subscription.duration,
        amount: subscription.amount || 0,
        currency: subscription.currency,
        auto_renew: subscription.auto_renew,
        payment_method: subscription.payment_method || 'bank_transfer'
      });
    }
  }, [subscription]);

  const calculateEndDate = (startDate: string, duration: string) => {
    const start = new Date(startDate);
    switch (duration) {
      case '1_month': return addMonths(start, 1);
      case '3_months': return addMonths(start, 3);
      case '6_months': return addMonths(start, 6);
      case '1_year': return addYears(start, 1);
      case '2_years': return addYears(start, 2);
      default: return addMonths(start, 1);
    }
  };

  const handleSave = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      const newEndDate = calculateEndDate(subscription.start_date, formData.duration);
      
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_type: formData.plan_type,
          duration: formData.duration,
          end_date: format(newEndDate, 'yyyy-MM-dd'),
          amount: formData.amount,
          currency: formData.currency,
          auto_renew: formData.auto_renew,
          payment_method: formData.payment_method,
          is_trial: false
        })
        .eq('id', subscription.id);

      if (error) throw error;

      toast.success("Abonnement mis à jour avec succès");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'Abonnement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Plan *</Label>
            <Select
              value={formData.plan_type}
              onValueChange={(value) => setFormData({ ...formData, plan_type: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Durée *</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData({ ...formData, duration: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1_month">1 mois</SelectItem>
                <SelectItem value="3_months">3 mois</SelectItem>
                <SelectItem value="6_months">6 mois</SelectItem>
                <SelectItem value="1_year">1 an</SelectItem>
                <SelectItem value="2_years">2 ans</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Montant</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Devise</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAD">MAD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="XOF">XOF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Méthode de paiement</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="check">Chèque</SelectItem>
                <SelectItem value="online">Paiement en ligne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto_renew"
              checked={formData.auto_renew}
              onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="auto_renew" className="cursor-pointer">
              Renouvellement automatique
            </Label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
