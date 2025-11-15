import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cycle } from "@/hooks/useCycles";

interface CycleFormProps {
  cycle?: Cycle;
  onSubmit: (cycleData: {
    name: string;
    description?: string;
    level?: string;
    duration_years?: number;
  }) => void;
  onCancel?: () => void;
}

export const CycleForm = ({ cycle, onSubmit, onCancel }: CycleFormProps) => {
  const [name, setName] = useState(cycle?.name || "");
  const [description, setDescription] = useState(cycle?.description || "");
  const [level, setLevel] = useState(cycle?.level || "");
  const [durationYears, setDurationYears] = useState(cycle?.duration_years?.toString() || "3");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      level: level || undefined,
      duration_years: durationYears ? parseInt(durationYears) : undefined,
    });
    
    if (!cycle) {
      setName("");
      setDescription("");
      setLevel("");
      setDurationYears("3");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom du cycle *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Licence en Informatique, Master en Finance..."
          required
        />
      </div>

      <div>
        <Label htmlFor="level">Niveau</Label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Licence">Licence</SelectItem>
            <SelectItem value="Master">Master</SelectItem>
            <SelectItem value="Doctorat">Doctorat</SelectItem>
            <SelectItem value="DUT">DUT</SelectItem>
            <SelectItem value="BTS">BTS</SelectItem>
            <SelectItem value="Autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="duration">Durée (années)</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          max="10"
          value={durationYears}
          onChange={(e) => setDurationYears(e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description du cycle..."
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit">
          {cycle ? "Mettre à jour" : "Créer le cycle"}
        </Button>
      </div>
    </form>
  );
};
