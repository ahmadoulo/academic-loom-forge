import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Cycle } from "@/hooks/useCycles";
import { GraduationCap, Calculator } from "lucide-react";

interface CycleFormProps {
  cycle?: Cycle;
  onSubmit: (cycleData: {
    name: string;
    description?: string;
    level?: string;
    duration_years?: number;
    calculation_system?: 'credit' | 'coefficient';
  }) => void;
  onCancel?: () => void;
}

export const CycleForm = ({ cycle, onSubmit, onCancel }: CycleFormProps) => {
  const [name, setName] = useState(cycle?.name || "");
  const [description, setDescription] = useState(cycle?.description || "");
  const [level, setLevel] = useState(cycle?.level || "");
  const [durationYears, setDurationYears] = useState(cycle?.duration_years?.toString() || "3");
  const [calculationSystem, setCalculationSystem] = useState<'credit' | 'coefficient'>(
    cycle?.calculation_system || "coefficient"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      level: level || undefined,
      duration_years: durationYears ? parseInt(durationYears) : undefined,
      calculation_system: calculationSystem,
    });
    
    if (!cycle) {
      setName("");
      setDescription("");
      setLevel("");
      setDurationYears("3");
      setCalculationSystem("coefficient");
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

      <div className="space-y-3">
        <Label>Système de calcul des notes *</Label>
        <RadioGroup
          value={calculationSystem}
          onValueChange={(v) => setCalculationSystem(v as 'credit' | 'coefficient')}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <div className={`relative flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${calculationSystem === 'coefficient' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/50'}`}>
            <RadioGroupItem value="coefficient" id="coefficient" className="mt-1" />
            <label htmlFor="coefficient" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <Calculator className="h-4 w-4 text-primary" />
                Coefficient
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Système classique avec pondération par coefficient. Les moyennes sont calculées selon les coefficients des matières.
              </p>
            </label>
          </div>
          <div className={`relative flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${calculationSystem === 'credit' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/50'}`}>
            <RadioGroupItem value="credit" id="credit" className="mt-1" />
            <label htmlFor="credit" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <GraduationCap className="h-4 w-4 text-primary" />
                Crédits (LMD)
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Système LMD avec crédits ECTS. Une matière est validée si la moyenne ≥ 10.
              </p>
            </label>
          </div>
        </RadioGroup>
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
