import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Option } from "@/hooks/useOptions";
import { Cycle } from "@/hooks/useCycles";

interface OptionFormProps {
  option?: Option;
  cycles: Cycle[];
  onSubmit: (optionData: {
    cycle_id: string;
    name: string;
    description?: string;
    code?: string;
  }) => void;
  onCancel?: () => void;
}

export const OptionForm = ({ option, cycles, onSubmit, onCancel }: OptionFormProps) => {
  const [cycleId, setCycleId] = useState(option?.cycle_id || "");
  const [name, setName] = useState(option?.name || "");
  const [description, setDescription] = useState(option?.description || "");
  const [code, setCode] = useState(option?.code || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cycleId) return;
    
    onSubmit({
      cycle_id: cycleId,
      name: name.trim(),
      description: description.trim() || undefined,
      code: code.trim() || undefined,
    });
    
    if (!option) {
      setName("");
      setDescription("");
      setCode("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="cycle">Cycle *</Label>
        <Select value={cycleId} onValueChange={setCycleId} disabled={!!option}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un cycle" />
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

      <div>
        <Label htmlFor="name">Nom de l'option *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Développement Web, Cybersécurité..."
          required
        />
      </div>

      <div>
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ex: DEV, CYBER..."
          maxLength={10}
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description de l'option..."
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
          {option ? "Mettre à jour" : "Créer l'option"}
        </Button>
      </div>
    </form>
  );
};
