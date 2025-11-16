import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCycles } from "@/hooks/useCycles";
import { useOptions } from "@/hooks/useOptions";
import { Class } from "@/hooks/useClasses";

interface ClassFormProps {
  schoolId: string;
  classToEdit?: Class & { cycle_id?: string; option_id?: string; year_level?: number; is_specialization?: boolean };
  onSubmit: (classData: {
    name: string;
    cycle_id?: string;
    option_id?: string;
    year_level?: number;
    is_specialization?: boolean;
  }) => void;
  onCancel?: () => void;
}

export const ClassForm = ({ schoolId, classToEdit, onSubmit, onCancel }: ClassFormProps) => {
  const [name, setName] = useState(classToEdit?.name || "");
  const [cycleId, setCycleId] = useState(classToEdit?.cycle_id || "");
  const [yearLevel, setYearLevel] = useState(classToEdit?.year_level?.toString() || "");
  const [isSpecialization, setIsSpecialization] = useState(classToEdit?.is_specialization || false);
  const [optionId, setOptionId] = useState(classToEdit?.option_id || "");
  
  const { cycles } = useCycles(schoolId);
  const { options, refetch: refetchOptions } = useOptions(schoolId, cycleId || undefined);
  
  const selectedCycle = cycles.find(c => c.id === cycleId);

  useEffect(() => {
    if (cycleId) {
      refetchOptions();
      if (!classToEdit) {
        setOptionId("");
        setYearLevel("");
      }
    }
  }, [cycleId]);

  useEffect(() => {
    if (!isSpecialization) {
      setOptionId("");
    }
  }, [isSpecialization]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      cycle_id: cycleId || undefined,
      option_id: isSpecialization ? (optionId || undefined) : undefined,
      year_level: yearLevel ? parseInt(yearLevel) : undefined,
      is_specialization: isSpecialization,
    });
    
    if (!classToEdit) {
      // Reset form only if creating new class
      setName("");
      setCycleId("");
      setYearLevel("");
      setIsSpecialization(false);
      setOptionId("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Nom de la classe *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: 6ème A, Terminale S1..."
          required
        />
      </div>

      {cycles.length > 0 && (
        <div>
          <Label htmlFor="cycle">Cycle</Label>
          <Select value={cycleId} onValueChange={setCycleId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un cycle (optionnel)" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {cycle.name} {cycle.level && `(${cycle.level})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {cycleId && selectedCycle && (
        <div>
          <Label htmlFor="yearLevel">Année du cycle</Label>
          <Select value={yearLevel} onValueChange={setYearLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner l'année" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: selectedCycle.duration_years || 3 }, (_, i) => i + 1).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year === 1 ? '1ère année' : `${year}ème année`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {cycleId && (
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="specialization" 
            checked={isSpecialization}
            onCheckedChange={(checked) => setIsSpecialization(checked as boolean)}
          />
          <Label htmlFor="specialization" className="cursor-pointer">
            Classe de spécialisation (avec option)
          </Label>
        </div>
      )}

      {isSpecialization && cycleId && options.length > 0 && (
        <div>
          <Label htmlFor="option">Option de spécialisation *</Label>
          <Select value={optionId} onValueChange={setOptionId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une option" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name} {option.code && `(${option.code})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isSpecialization && cycleId && options.length === 0 && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          Aucune option disponible pour ce cycle. Créez d'abord des options dans les paramètres.
        </div>
      )}
      
      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit">
          {classToEdit ? 'Mettre à jour' : 'Créer la classe'}
        </Button>
      </div>
    </form>
  );
};