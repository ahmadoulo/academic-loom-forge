import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSchools } from "@/hooks/useSchools";
import { toast } from "sonner";
import { Building2, MapPin, Globe, Phone, Mail } from "lucide-react";

interface SchoolFormProps {
  editingSchool?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SchoolForm({ editingSchool, onSuccess, onCancel }: SchoolFormProps) {
  const { createSchool, updateSchool } = useSchools();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.identifier) {
      toast.error('Le nom et l\'identifiant sont requis');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSchool) {
        await updateSchool(editingSchool.id, formData);
        toast.success('École modifiée avec succès');
      } else {
        await createSchool(formData);
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
            Identifiant unique *
          </Label>
          <Input
            id="identifier"
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value.toLowerCase().replace(/\s/g, '-') })}
            placeholder="Ex: lycee-mohammed-v"
            required
            disabled={!!editingSchool}
            className="w-full font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {editingSchool ? 'L\'identifiant ne peut pas être modifié' : 'Utilisé dans l\'URL de l\'école'}
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
