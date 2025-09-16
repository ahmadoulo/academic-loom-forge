import { useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, TrendingUp, Save, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TeacherDashboard = () => {
  const { teacherId } = useParams();
  const { toast } = useToast();

  // Mock data - would come from database
  const teacher = {
    name: "M. Jean Dubois",
    subject: "Mathématiques",
    school: "Lycée Victor Hugo"
  };

  const [students, setStudents] = useState([
    { id: "1", firstname: "Jean", lastname: "Dupont", class: "Terminale S", grades: [{ value: 15, date: "2024-01-15", coefficient: 1 }] },
    { id: "2", firstname: "Marie", lastname: "Martin", class: "Terminale S", grades: [{ value: 17, date: "2024-01-15", coefficient: 1 }] },
    { id: "3", firstname: "Pierre", lastname: "Durand", class: "Terminale S", grades: [{ value: 12, date: "2024-01-15", coefficient: 1 }] },
    { id: "4", firstname: "Sophie", lastname: "Leclerc", class: "Première S", grades: [{ value: 14, date: "2024-01-15", coefficient: 1 }] },
    { id: "5", firstname: "Antoine", lastname: "Moreau", class: "Première S", grades: [{ value: 16, date: "2024-01-15", coefficient: 1 }] }
  ]);

  const [newGrades, setNewGrades] = useState<{ [key: string]: string }>({});
  const [newGradeCoeff, setNewGradeCoeff] = useState("1");

  const calculateAverage = (grades: any[]) => {
    if (!grades.length) return "N/A";
    const total = grades.reduce((sum, grade) => sum + (grade.value * grade.coefficient), 0);
    const totalCoeff = grades.reduce((sum, grade) => sum + grade.coefficient, 0);
    return (total / totalCoeff).toFixed(1);
  };

  const handleGradeChange = (studentId: string, value: string) => {
    setNewGrades(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSaveGrade = (studentId: string) => {
    const gradeValue = parseFloat(newGrades[studentId]);
    const coefficient = parseFloat(newGradeCoeff);
    
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 20) {
      toast({
        title: "Note invalide",
        description: "La note doit être comprise entre 0 et 20",
        variant: "destructive"
      });
      return;
    }

    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? {
            ...student,
            grades: [...student.grades, {
              value: gradeValue,
              date: new Date().toISOString(),
              coefficient
            }]
          }
        : student
    ));

    setNewGrades(prev => {
      const updated = { ...prev };
      delete updated[studentId];
      return updated;
    });

    toast({
      title: "Note enregistrée",
      description: `Note de ${gradeValue}/20 ajoutée avec succès`,
    });
  };

  const handleSaveAllGrades = () => {
    let savedCount = 0;
    Object.keys(newGrades).forEach(studentId => {
      const gradeValue = parseFloat(newGrades[studentId]);
      if (!isNaN(gradeValue) && gradeValue >= 0 && gradeValue <= 20) {
        handleSaveGrade(studentId);
        savedCount++;
      }
    });
    
    if (savedCount > 0) {
      toast({
        title: "Notes enregistrées",
        description: `${savedCount} note(s) enregistrée(s) avec succès`,
      });
    }
  };

  const terminaleSStudents = students.filter(s => s.class === "Terminale S");
  const premiereSStudents = students.filter(s => s.class === "Première S");

  return (
    <div className="min-h-screen bg-background">
      <Header title={teacher.subject} userRole="teacher" schoolName={teacher.school} />
      
      <main className="container mx-auto px-6 py-8">
        {/* Teacher Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Interface Professeur - {teacher.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Matière:</span>
                <Badge variant="secondary">{teacher.subject}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Étudiants:</span>
                <span className="text-primary font-semibold">{students.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Classes:</span>
                <span className="text-primary font-semibold">2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade Input Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Paramètres de Notation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Coefficient:</label>
                <Input
                  type="number"
                  min="0.5"
                  max="3"
                  step="0.5"
                  value={newGradeCoeff}
                  onChange={(e) => setNewGradeCoeff(e.target.value)}
                  className="w-20"
                />
              </div>
              <Button onClick={handleSaveAllGrades} className="gap-2">
                <Save className="h-4 w-4" />
                Enregistrer toutes les notes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Terminale S Students */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Terminale S ({terminaleSStudents.length} étudiants)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Étudiant</th>
                    <th className="text-center p-2">Moyenne</th>
                    <th className="text-center p-2">Dernières Notes</th>
                    <th className="text-center p-2">Nouvelle Note</th>
                    <th className="text-center p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {terminaleSStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/30">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{student.firstname} {student.lastname}</p>
                          <p className="text-xs text-muted-foreground">{student.class}</p>
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <Badge variant="outline" className="font-mono">
                          {calculateAverage(student.grades)}/20
                        </Badge>
                      </td>
                      <td className="text-center p-2">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {student.grades.slice(-3).map((grade, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {grade.value}/20
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          placeholder="Note/20"
                          value={newGrades[student.id] || ""}
                          onChange={(e) => handleGradeChange(student.id, e.target.value)}
                          className="w-24 mx-auto text-center"
                        />
                      </td>
                      <td className="text-center p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveGrade(student.id)}
                          disabled={!newGrades[student.id]}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Première S Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Première S ({premiereSStudents.length} étudiants)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Étudiant</th>
                    <th className="text-center p-2">Moyenne</th>
                    <th className="text-center p-2">Dernières Notes</th>
                    <th className="text-center p-2">Nouvelle Note</th>
                    <th className="text-center p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {premiereSStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/30">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{student.firstname} {student.lastname}</p>
                          <p className="text-xs text-muted-foreground">{student.class}</p>
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <Badge variant="outline" className="font-mono">
                          {calculateAverage(student.grades)}/20
                        </Badge>
                      </td>
                      <td className="text-center p-2">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {student.grades.slice(-3).map((grade, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {grade.value}/20
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          placeholder="Note/20"
                          value={newGrades[student.id] || ""}
                          onChange={(e) => handleGradeChange(student.id, e.target.value)}
                          className="w-24 mx-auto text-center"
                        />
                      </td>
                      <td className="text-center p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveGrade(student.id)}
                          disabled={!newGrades[student.id]}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TeacherDashboard;