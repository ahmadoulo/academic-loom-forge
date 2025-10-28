import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClassFormProps {
  onSubmit: (classData: {
    name: string;
  }) => void;
}

export const ClassForm = ({ onSubmit }: ClassFormProps) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim()
    });
    
    // Reset form
    setName("");
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
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit">
          Créer la classe
        </Button>
      </div>
    </form>
  );
};