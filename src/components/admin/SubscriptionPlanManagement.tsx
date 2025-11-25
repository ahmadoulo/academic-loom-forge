import { useState } from "react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Users, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionPlanForm {
  name: string;
  type: 'basic' | 'standard' | 'premium';
  description: string;
  student_limit: number | null;
  teacher_limit: number | null;
  features: string[];
}

export function SubscriptionPlanManagement() {
  const { plans, loading, refetch } = useSubscriptionPlans();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<SubscriptionPlanForm>({
    name: "",
    type: "basic",
    description: "",
    student_limit: null,
    teacher_limit: null,
    features: []
  });

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      type: plan.type,
      description: plan.description || "",
      student_limit: plan.student_limit,
      teacher_limit: plan.teacher_limit,
      features: plan.features || []
    });
    setShowDialog(true);
  };

  const handleAdd = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      type: "basic",
      description: "",
      student_limit: null,
      teacher_limit: null,
      features: []
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Le nom du plan est requis");
      return;
    }

    setSaving(true);
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update({
            name: formData.name,
            type: formData.type,
            description: formData.description,
            student_limit: formData.student_limit,
            teacher_limit: formData.teacher_limit,
            features: formData.features.length > 0 ? formData.features : null
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success("Plan mis à jour avec succès");
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert({
            name: formData.name,
            type: formData.type,
            description: formData.description,
            student_limit: formData.student_limit,
            teacher_limit: formData.teacher_limit,
            features: formData.features.length > 0 ? formData.features : null
          });

        if (error) throw error;
        toast.success("Plan créé avec succès");
      }

      refetch();
      setShowDialog(false);
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'basic':
        return <Badge variant="secondary">Basic</Badge>;
      case 'standard':
        return <Badge variant="default">Standard</Badge>;
      case 'premium':
        return <Badge className="bg-gradient-to-r from-primary to-accent">Premium</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Plans d'Abonnement</h2>
            <p className="text-muted-foreground">Gérer les plans disponibles</p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                    {getTypeBadge(plan.type)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {plan.description || "Aucune description"}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {plan.student_limit ? `${plan.student_limit} étudiants max` : "Étudiants illimités"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {plan.teacher_limit ? `${plan.teacher_limit} professeurs max` : "Professeurs illimités"}
                    </span>
                  </div>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <div className="pt-4 border-t space-y-1">
                    {plan.features.map((feature: string, idx: number) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        • {feature}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Modifier le Plan" : "Nouveau Plan"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nom du Plan *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Plan Premium"
              />
            </div>

            <div>
              <Label>Type *</Label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du plan..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Limite d'Étudiants</Label>
                <Input
                  type="number"
                  value={formData.student_limit || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    student_limit: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="Illimité si vide"
                />
              </div>
              <div>
                <Label>Limite de Professeurs</Label>
                <Input
                  type="number"
                  value={formData.teacher_limit || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    teacher_limit: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="Illimité si vide"
                />
              </div>
            </div>

            <div>
              <Label>Fonctionnalités (une par ligne)</Label>
              <Textarea
                value={formData.features.join('\n')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  features: e.target.value.split('\n').filter(f => f.trim()) 
                })}
                placeholder="Gestion des notes&#10;Bulletins automatiques&#10;Emploi du temps"
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
