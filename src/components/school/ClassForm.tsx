import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCycles } from "@/hooks/useCycles";
import { useOptions } from "@/hooks/useOptions";

interface ClassFormProps {
  schoolId: string;
  onSubmit: (classData: {
    name: string;
    cycle_id?: string;
    option_id?: string;
  }) => void;
}

export const ClassForm = ({ schoolId, onSubmit }: ClassFormProps) => {
  const [name, setName] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [optionId, setOptionId] = useState("");
  
  const { cycles } = useCycles(schoolId);
  const { options, refetch: refetchOptions } = useOptions(schoolId, cycleId || undefined);

  useEffect(() => {
    if (cycleId) {
      refetchOptions();
      setOptionId("");
    }
  }, [cycleId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      cycle_id: cycleId || undefined,
      option_id: optionId || undefined,
    });
    
    // Reset form
    setName("");
    setCycleId("");
    setOptionId("");
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

      {cycleId && options.length > 0 && (
        <div>
          <Label htmlFor="option">Option</Label>
          <Select value={optionId} onValueChange={setOptionId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une option (optionnel)" />
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
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit">
          Créer la classe
        </Button>
      </div>
    </form>
  );
};