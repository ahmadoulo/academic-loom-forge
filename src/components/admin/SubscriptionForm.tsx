import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Star, CreditCard, Banknote, CheckCheck, DollarSign, MoreHorizontal, Calendar, Info } from "lucide-react";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions, CreateSubscriptionData } from "@/hooks/useSubscriptions";
import { toast } from "sonner";

interface SubscriptionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PLANS = [
  { value: 'basic', label: 'Basic', icon: '⭐', color: 'text-gray-600' },
  { value: 'standard', label: 'Standard', icon: '⭐⭐', color: 'text-blue-600' },
  { value: 'premium', label: 'Premium', icon: '⭐⭐⭐', color: 'text-purple-600' },
] as const;

const DURATIONS = [
  { value: '1_month', label: '1 mois', shortLabel: '1 mois' },
  { value: '3_months', label: '3 mois', shortLabel: '3 mois' },
  { value: '6_months', label: '6 mois', shortLabel: '6 mois' },
  { value: '1_year', label: '1 an', shortLabel: '1 an' },
  { value: '2_years', label: '2 ans', shortLabel: '2 ans' },
] as const;

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces', icon: Banknote },
  { value: 'bank_transfer', label: 'Virement bancaire', icon: DollarSign },
  { value: 'check', label: 'Chèque', icon: CheckCheck },
  { value: 'card', label: 'Carte bancaire', icon: CreditCard },
  { value: 'other', label: 'Autre', icon: MoreHorizontal },
] as const;

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000];

export function SubscriptionForm({ onSuccess, onCancel }: SubscriptionFormProps) {
  const { schools } = useSchools();
  const { createSubscription } = useSubscriptions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateSubscriptionData>({
    school_id: '',
    plan_type: 'basic',
    duration: '1_month',
    start_date: new Date().toISOString().split('T')[0],
    amount: undefined,
    payment_method: undefined,
    transaction_id: '',
    notes: '',
    is_trial: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.school_id) {
      toast.error('Veuillez sélectionner une école');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSubscription(formData);
      toast.success('Abonnement créé avec succès');
      onSuccess?.();
    } catch (error) {
      console.error('Erreur création abonnement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEndDate = () => {
    if (!formData.start_date || !formData.duration) return '';
    const start = new Date(formData.start_date);
    const end = new Date(start);

    switch (formData.duration) {
      case '1_month': end.setMonth(start.getMonth() + 1); break;
      case '3_months': end.setMonth(start.getMonth() + 3); break;
      case '6_months': end.setMonth(start.getMonth() + 6); break;
      case '1_year': end.setFullYear(start.getFullYear() + 1); break;
      case '2_years': end.setFullYear(start.getFullYear() + 2); break;
    }

    return end.toISOString().split('T')[0];
  };

  const endDate = calculateEndDate();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* École Selection */}
      <div className="space-y-2">
        <Label htmlFor="school">École *</Label>
        <Select
          value={formData.school_id}
          onValueChange={(value) => setFormData({ ...formData, school_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une option" />
          </SelectTrigger>
          <SelectContent>
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Sélectionnez l'école pour laquelle vous créez cet abonnement
        </p>
      </div>

      {/* Plan and Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Plan *</Label>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map((plan) => (
              <button
                key={plan.value}
                type="button"
                onClick={() => setFormData({ ...formData, plan_type: plan.value })}
                className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                  formData.plan_type === plan.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">{plan.icon}</span>
                <span className={`text-sm font-medium ${plan.color}`}>{plan.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Durée *</Label>
          <Select
            value={formData.duration}
            onValueChange={(value: any) => setFormData({ ...formData, duration: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((duration) => (
                <SelectItem key={duration.value} value={duration.value}>
                  {duration.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            {['1_month', '3_months', '6_months', '1_year', '2_years'].map((dur) => {
              const duration = DURATIONS.find(d => d.value === dur);
              return (
                <Button
                  key={dur}
                  type="button"
                  variant={formData.duration === dur ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, duration: dur as any })}
                  className="flex-1"
                >
                  {duration?.shortLabel}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Date de début *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="start-date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="pl-10"
              required
            />
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="p-0 h-auto text-xs"
            onClick={() => setFormData({ ...formData, start_date: new Date().toISOString().split('T')[0] })}
          >
            Aujourd'hui
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Date de fin *</Label>
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">{endDate ? new Date(endDate).toLocaleDateString('fr-FR') : '-'}</p>
            <p className="text-xs text-muted-foreground">
              La date de début est automatiquement fixée à aujourd'hui pour garantir une date valide.
            </p>
          </div>
        </div>
      </div>

      {/* Montant */}
      <div className="space-y-2">
        <Label htmlFor="amount">Montant *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || undefined })}
            placeholder="0.00"
            className="pl-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            MAD
          </span>
        </div>
        <div className="flex gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <Button
              key={amount}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({ ...formData, amount })}
              className="flex-1"
            >
              {amount.toLocaleString()} MAD
            </Button>
          ))}
        </div>
      </div>

      {/* Méthode de paiement */}
      <div className="space-y-2">
        <Label>Méthode de paiement *</Label>
        <div className="grid grid-cols-5 gap-2">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: method.value })}
                className={`p-3 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                  formData.payment_method === method.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs text-center">{method.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ID de transaction */}
      <div className="space-y-2">
        <Label htmlFor="transaction-id">ID de transaction</Label>
        <Input
          id="transaction-id"
          value={formData.transaction_id}
          onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
          placeholder="ex: TR-12345"
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Référence de la transaction (facultatif)
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Informations supplémentaires sur cet abonnement..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Ajoutez des détails supplémentaires sur cet abonnement (facultatif)
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Création...' : 'Créer l\'Abonnement'}
        </Button>
      </div>
    </form>
  );
}