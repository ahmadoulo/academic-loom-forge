import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubjects } from "@/hooks/useSubjects";
import { useClasses } from "@/hooks/useClasses";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useSemester } from "@/hooks/useSemester";

interface ExamDocumentFormProps {
  teacherId: string;
  schoolId: string;
  onSubmit: (data: {
    subject_id: string;
    class_id: string;
    exam_type: string;
    duration_minutes: number;
    documents_allowed: boolean;
    school_year_id: string;
    school_semester_id?: string;
  }) => void;
  onCancel: () => void;
}

export function ExamDocumentForm({ teacherId, schoolId, onSubmit, onCancel }: ExamDocumentFormProps) {
  const { currentYear } = useAcademicYear();
  const { currentSemester } = useSemester();
  const { subjects } = useSubjects(schoolId);
  const { classes } = useClasses(schoolId);

  const [formData, setFormData] = useState({
    subject_id: "",
    class_id: "",
    exam_type: "examen",
    duration_minutes: 60,
    documents_allowed: false
  });

  const teacherSubjects = subjects.filter(s => s.teacher_id === teacherId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentYear) return;

    onSubmit({
      ...formData,
      school_year_id: currentYear.id,
      school_semester_id: currentSemester?.id
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un Document d'Examen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Matière *</Label>
            <Select
              value={formData.subject_id}
              onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
              required
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder="Sélectionner une matière" />
              </SelectTrigger>
              <SelectContent>
                {teacherSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Classe *</Label>
            <Select
              value={formData.class_id}
              onValueChange={(value) => setFormData({ ...formData, class_id: value })}
              required
            >
              <SelectTrigger id="class">
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam_type">Type *</Label>
            <Select
              value={formData.exam_type}
              onValueChange={(value) => setFormData({ ...formData, exam_type: value })}
              required
            >
              <SelectTrigger id="exam_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="devoir_surveille">Devoir Surveillé</SelectItem>
                <SelectItem value="controle">Contrôle</SelectItem>
                <SelectItem value="examen">Examen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Durée (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="documents_allowed"
              checked={formData.documents_allowed}
              onCheckedChange={(checked) => setFormData({ ...formData, documents_allowed: checked as boolean })}
            />
            <Label htmlFor="documents_allowed" className="cursor-pointer">
              Documents autorisés
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Créer le Document
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
