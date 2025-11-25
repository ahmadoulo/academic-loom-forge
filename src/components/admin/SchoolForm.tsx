import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { toast } from "sonner";
import { Building2, MapPin, Globe, Phone, CreditCard, Clock } from "lucide-react";

interface SchoolFormProps {
  editingSchool?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SchoolForm({ editingSchool, onSuccess, onCancel }: SchoolFormProps) {
  const { createSchool, updateSchool } = useSchools();
  const { createSubscription } = useSubscriptions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: editingSchool?.name || '',
    identifier: editingSchool?.identifier || '',
    address: editingSchool?.address || '',
    city: editingSchool?.city || '',
    country: editingSchool?.country || 'Maroc',
    phone: editingSchool?.phone || '',
    website: editingSchool?.website || '',
  });

  const [subscriptionData, setSubscriptionData] = useState({
    hasSubscription: false,
    isTrial: true,
    trialDays: 30,
    planType: 'basic' as 'basic' | 'standard' | 'premium',
    duration: '1_month' as '1_month' | '3_months' | '6_months' | '1_year' | '2_years',
    amount: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Le nom de l\'école est requis');
      return;
    }

    // Generate identifier automatically if not provided
    const finalFormData = {
      ...formData,
      identifier: formData.identifier || formData.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
        .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
        .substring(0, 50) // Limit length
    };

    setIsSubmitting(true);
    try {
      if (editingSchool) {
        await updateSchool(editingSchool.id, finalFormData);
        toast.success('École modifiée avec succès');
      } else {
        const school = await createSchool(finalFormData);
        
        // Create subscription if requested
        if (subscriptionData.hasSubscription && school) {
          const today = new Date();
          const endDate = new Date();
          
          if (subscriptionData.isTrial) {
            endDate.setDate(today.getDate() + subscriptionData.trialDays);
            await createSubscription({
              school_id: school.id,
              plan_type: 'basic',
              duration: '1_month',
              start_date: today.toISOString().split('T')[0],
              is_trial: true,
              trial_end_date: endDate.toISOString().split('T')[0],
            });
          } else {
            const durationMonths = 
              subscriptionData.duration === '1_month' ? 1 :
              subscriptionData.duration === '3_months' ? 3 :
              subscriptionData.duration === '6_months' ? 6 :
              subscriptionData.duration === '1_year' ? 12 :
              24;
            endDate.setMonth(today.getMonth() + durationMonths);
            await createSubscription({
              school_id: school.id,
              plan_type: subscriptionData.planType,
              duration: subscriptionData.duration,
              start_date: today.toISOString().split('T')[0],
              amount: subscriptionData.amount,
              is_trial: false,
            });
          }
        }
        
        toast.success('École créée avec succès');
      }
      onSuccess?.();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de base */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Nom de l'école *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Lycée Mohammed V"
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-sm font-medium">
            Identifiant unique
          </Label>
          <Input
            id="identifier"
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value.toLowerCase().replace(/\s/g, '-') })}
            placeholder="Ex: lycee-mohammed-v (généré automatiquement si vide)"
            disabled={!!editingSchool}
            className="w-full font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {editingSchool ? 'L\'identifiant ne peut pas être modifié' : 'Laissez vide pour génération automatique. Utilisé dans l\'URL de l\'école'}
          </p>
        </div>
      </div>

      {/* Localisation */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Localisation
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ex: Casablanca"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Ex: Maroc"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse complète</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Ex: 123 Avenue Hassan II"
          />
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          Contact
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              Téléphone
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: +212 5XX-XXXXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-3 w-3" />
              Site web
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="Ex: https://ecole.ma"
            />
          </div>
        </div>
      </div>

      {/* Subscription Section (only for new schools) */}
      {!editingSchool && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Abonnement
              </h3>
              <p className="text-xs text-muted-foreground">
                Assignez un abonnement ou période d'essai à cette école
              </p>
            </div>
            <Switch
              checked={subscriptionData.hasSubscription}
              onCheckedChange={(checked) => setSubscriptionData({ ...subscriptionData, hasSubscription: checked })}
            />
          </div>

          {subscriptionData.hasSubscription && (
            <div className="space-y-4 pl-6 border-l-2 border-border">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={subscriptionData.isTrial}
                    onCheckedChange={(checked) => setSubscriptionData({ ...subscriptionData, isTrial: checked })}
                  />
                  <Label className="text-sm">Période d'essai</Label>
                </div>
              </div>

              {subscriptionData.isTrial ? (
                <div className="space-y-2">
                  <Label htmlFor="trialDays" className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Nombre de jours d'essai
                  </Label>
                  <Input
                    id="trialDays"
                    type="number"
                    min="1"
                    max="90"
                    value={subscriptionData.trialDays}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, trialDays: parseInt(e.target.value) || 30 })}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="planType">Type de plan</Label>
                    <Select
                      value={subscriptionData.planType}
                      onValueChange={(value: any) => setSubscriptionData({ ...subscriptionData, planType: value })}
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

                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée</Label>
                    <Select
                      value={subscriptionData.duration}
                      onValueChange={(value: any) => setSubscriptionData({ ...subscriptionData, duration: value })}
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

                  <div className="space-y-2">
                    <Label htmlFor="amount">Montant (MAD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      value={subscriptionData.amount}
                      onChange={(e) => setSubscriptionData({ ...subscriptionData, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : editingSchool ? 'Modifier' : 'Créer l\'école'}
        </Button>
      </div>
    </form>
  );
}
