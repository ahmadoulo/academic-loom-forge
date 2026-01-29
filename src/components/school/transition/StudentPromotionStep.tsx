import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClassesByYear } from '@/hooks/useClassesByYear';
import { useYearTransition } from '@/hooks/useYearTransition';
import { ArrowRight, ArrowLeft, UserCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface StudentPromotionStepProps {
  schoolId: string;
  currentYearId: string;
  nextYearId: string;
  preparationId: string;
  onComplete: () => void;
  onBack: () => void;
}

interface StudentWithTransition {
  id: string;
  student_id: string;
  class_id: string;
  firstname: string;
  lastname: string;
  cin_number: string;
  to_class_id: string | null;
  transition_type: 'promoted' | 'retained' | 'departed' | 'transferred';
}

export const StudentPromotionStep = ({
  schoolId,
  currentYearId,
  nextYearId,
  preparationId,
  onComplete,
  onBack
}: StudentPromotionStepProps) => {
  // Charger toutes les classes de l'école pour afficher les noms corrects
  const { classes: allClasses } = useClassesByYear(schoolId, undefined, true);
  const { classes: nextClasses } = useClassesByYear(schoolId, nextYearId);
  const {
    getClassMappings,
    getStudentsByClass,
    promoteStudents,
    loading
  } = useYearTransition(schoolId);

  const [students, setStudents] = useState<StudentWithTransition[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    loadStudentsWithMappings();
  }, [preparationId]);

  const loadStudentsWithMappings = async () => {
    try {
      setLoadingStudents(true);
      
      // Récupérer les mappings
      const mappings = await getClassMappings(preparationId);
      
      if (mappings.length === 0) {
        setStudents([]);
        setLoadingStudents(false);
        return;
      }
      
      // Pour chaque mapping, récupérer les étudiants de la classe source
      const allStudents: StudentWithTransition[] = [];
      
      for (const mapping of mappings) {
        // Récupérer l'année de la classe source
        const sourceClass = allClasses?.find(c => c.id === mapping.from_class_id);
        const sourceYearId = sourceClass?.school_year_id;
        
        // Récupérer les étudiants avec l'année correcte
        const classStudents = await getStudentsByClass(mapping.from_class_id, sourceYearId || currentYearId);
        
        classStudents.forEach((enrollment: any) => {
          if (enrollment.students) {
            allStudents.push({
              id: enrollment.id,
              student_id: enrollment.students.id,
              class_id: mapping.from_class_id,
              firstname: enrollment.students.firstname,
              lastname: enrollment.students.lastname,
              cin_number: enrollment.students.cin_number,
              to_class_id: mapping.to_class_id, // Classe de destination par défaut
              transition_type: 'promoted'
            });
          }
        });
      }
      
      setStudents(allStudents);
      // Sélectionner tous les étudiants par défaut
      setSelectedStudents(allStudents.map(s => s.student_id));
    } catch (error) {
      toast.error('Erreur lors du chargement des étudiants');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleUpdateStudent = (studentId: string, field: 'to_class_id' | 'transition_type', value: string) => {
    setStudents(prev =>
      prev.map(s =>
        s.student_id === studentId
          ? { ...s, [field]: value }
          : s
      )
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.student_id));
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handlePromote = async () => {
    const selectedStudentData = students.filter(s => selectedStudents.includes(s.student_id));
    
    if (selectedStudentData.length === 0) {
      toast.error('Veuillez sélectionner au moins un étudiant');
      return;
    }

    try {
      const transitions = selectedStudentData.map(s => ({
        student_id: s.student_id,
        from_class_id: s.class_id,
        to_class_id: s.transition_type === 'departed' ? null : s.to_class_id,
        transition_type: s.transition_type
      }));

      await promoteStudents(preparationId, transitions);
      toast.success(`${transitions.length} étudiants promus avec succès`);
      onComplete();
    } catch (error) {
      console.error('Error promoting students:', error);
    }
  };

  const getClassName = (classId: string | null, isNext: boolean) => {
    if (!classId) return '-';
    const classList = isNext ? nextClasses : allClasses;
    const cls = classList?.find(c => c.id === classId);
    if (!cls) return 'Classe inconnue';
    
    // Afficher avec l'année pour les classes sources
    if (!isNext && cls.school_year) {
      return `${cls.name} (${cls.school_year.name})`;
    }
    return cls.name;
  };

  const groupedStudents = students.reduce((acc, student) => {
    const className = getClassName(student.class_id, false);
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(student);
    return acc;
  }, {} as Record<string, StudentWithTransition[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Promotion des étudiants
              </CardTitle>
              <CardDescription>
                Définissez la nouvelle classe pour chaque étudiant
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedStudents.length === students.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingStudents ? (
            <p className="text-sm text-muted-foreground">Chargement des étudiants...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun étudiant trouvé</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedStudents).map(([className, classStudents]) => (
                <div key={className} className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    {className}
                    <Badge variant="secondary">{classStudents.length} étudiants</Badge>
                  </h4>
                  <div className="space-y-2">
                    {classStudents.map((student) => (
                      <div
                        key={student.student_id}
                        className="flex items-center gap-4 p-3 bg-muted rounded-lg"
                      >
                        <Checkbox
                          checked={selectedStudents.includes(student.student_id)}
                          onCheckedChange={() => handleToggleStudent(student.student_id)}
                        />
                        
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {student.firstname} {student.lastname}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            CIN: {student.cin_number}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={student.transition_type}
                            onValueChange={(value: any) =>
                              handleUpdateStudent(student.student_id, 'transition_type', value)
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="promoted">Passage</SelectItem>
                              <SelectItem value="retained">Redoublement</SelectItem>
                              <SelectItem value="departed">Départ</SelectItem>
                            </SelectContent>
                          </Select>

                          {student.transition_type !== 'departed' && (
                            <Select
                              value={student.to_class_id || ''}
                              onValueChange={(value) =>
                                handleUpdateStudent(student.student_id, 'to_class_id', value)
                              }
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Classe" />
                              </SelectTrigger>
                              <SelectContent>
                                {nextClasses?.map((cls) => (
                                  <SelectItem key={cls.id} value={cls.id}>
                                    {cls.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button
          onClick={handlePromote}
          disabled={loading || selectedStudents.length === 0}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          Valider la promotion ({selectedStudents.length})
        </Button>
      </div>
    </div>
  );
};
