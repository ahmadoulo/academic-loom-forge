import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Award, Download, ArrowLeft, Users, GraduationCap, CheckCircle, XCircle, Settings } from "lucide-react";
import { generateLMDBulletinPdf, generateLMDBulletinInDoc, BulletinData, SemesterData, SubjectGradeData, StudentExtraData } from "@/utils/bulletinPdfExport";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { imageUrlToBase64 } from "@/utils/imageToBase64";
import { useSchoolSemesters } from "@/hooks/useSchoolSemesters";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useCycles } from "@/hooks/useCycles";
import { useOptions } from "@/hooks/useOptions";
import { useBulletinSettings } from "@/hooks/useBulletinSettings";
import { BulletinSettingsDialog } from "./BulletinSettingsDialog";
import { supabase } from "@/integrations/supabase/client";

interface BulletinSectionProps {
  schoolId: string;
  schoolName: string;
  schoolLogoUrl?: string;
  academicYear?: string;
  students: any[];
  classes: any[];
  grades: any[];
  subjects: any[];
  loading: boolean;
}

// Helper pour récupérer les absences d'un étudiant
const fetchStudentAbsences = async (studentId: string): Promise<{ total: number; justified: number }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('id, is_justified')
      .eq('student_id', studentId)
      .eq('status', 'absent');
    
    if (error) throw error;
    
    const total = data?.length || 0;
    const justified = data?.filter(a => a.is_justified).length || 0;
    
    return { total, justified };
  } catch (err) {
    console.error('Error fetching absences:', err);
    return { total: 0, justified: 0 };
  }
};

export const BulletinSection = ({
  schoolId,
  schoolName,
  schoolLogoUrl,
  academicYear,
  students,
  classes,
  grades,
  subjects,
  loading,
}: BulletinSectionProps) => {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [bulletinType, setBulletinType] = useState<'semester' | 'annual'>('semester');
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { selectedYear } = useAcademicYear();
  const { cycles } = useCycles(schoolId);
  const { options } = useOptions(schoolId);
  const { settings: bulletinSettings, loading: loadingSettings, updateSettings } = useBulletinSettings(schoolId);
  
  // Charger les semestres pour l'année sélectionnée
  const { semesters, loading: loadingSemesters } = useSchoolSemesters(schoolId, selectedYear?.id);
  
  // Déterminer le système de calcul pour une classe donnée via son cycle
  const getClassCalculationSystem = (classId: string): 'credit' | 'coefficient' => {
    const classItem = classes.find(c => c.id === classId);
    if (!classItem?.cycle_id) return 'coefficient'; // Par défaut coefficient si pas de cycle
    const cycle = cycles.find(c => c.id === classItem.cycle_id);
    return (cycle?.calculation_system as 'credit' | 'coefficient') || 'coefficient';
  };
  
  // Définir le semestre actuel par défaut
  React.useEffect(() => {
    if (semesters.length > 0 && !selectedSemester) {
      // Prioriser le semestre marqué comme actuel
      const currentSemester = semesters.find(s => s.is_actual);
      if (currentSemester) {
        setSelectedSemester(currentSemester.id);
      } else {
        // Sinon prendre le premier semestre
        setSelectedSemester(semesters[0].id);
      }
    }
  }, [semesters]);

  // Réinitialiser le semestre sélectionné quand l'année change
  React.useEffect(() => {
    setSelectedSemester("");
  }, [selectedYear?.id]);
  
  // Convertir le logo en base64
  React.useEffect(() => {
    const convertLogo = async () => {
      if (schoolLogoUrl) {
        try {
          const base64 = await imageUrlToBase64(schoolLogoUrl);
          setLogoBase64(base64);
        } catch (error) {
          console.error("Erreur conversion logo:", error);
        }
      }
    };
    convertLogo();
  }, [schoolLogoUrl]);

  // Récupérer les matières avec leurs crédits/coefficients pour une classe
  const getClassSubjects = (classId: string) => {
    return subjects.filter(s => s.class_id === classId);
  };

  // Calculer les notes d'un étudiant pour un semestre donné
  const getStudentSemesterData = (studentId: string, semesterId: string): SemesterData | null => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const calculationSystem = getClassCalculationSystem(student.class_id);
    const classSubjects = getClassSubjects(student.class_id);
    const semesterGrades = grades.filter(g => 
      g.student_id === studentId && 
      g.school_semester_id === semesterId
    );

    const subjectGrades: SubjectGradeData[] = classSubjects.map(subject => {
      const subjectGradesList = semesterGrades.filter(g => g.subject_id === subject.id);
      const hasGrades = subjectGradesList.length > 0;
      const average = hasGrades 
        ? subjectGradesList.reduce((sum, g) => sum + Number(g.grade) + (Number(g.bonus) || 0), 0) / subjectGradesList.length
        : 0;
      
      // Pour le système credit: utiliser coefficient comme valeur de crédit
      // Pour le système coefficient: utiliser coefficient comme poids
      const value = subject.coefficient || 1;
      const isValidated = hasGrades && average >= 10;

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        grades: subjectGradesList,
        average: hasGrades ? average : undefined,
        hasGrades,
        credits: value,
        coefficient: value,
        coefficientType: calculationSystem,
        isValidated
      };
    });

    const subjectsWithGrades = subjectGrades.filter(s => s.hasGrades);
    
    // Calcul de la moyenne selon le système
    let semesterAverage = 0;
    if (calculationSystem === 'coefficient' && subjectsWithGrades.length > 0) {
      // Moyenne pondérée par coefficient
      const totalWeight = subjectsWithGrades.reduce((sum, s) => sum + s.coefficient, 0);
      semesterAverage = totalWeight > 0
        ? subjectsWithGrades.reduce((sum, s) => sum + ((s.average || 0) * s.coefficient), 0) / totalWeight
        : 0;
    } else if (subjectsWithGrades.length > 0) {
      // Simple moyenne pour le système crédit
      semesterAverage = subjectsWithGrades.reduce((sum, s) => sum + (s.average || 0), 0) / subjectsWithGrades.length;
    }

    const totalCredits = subjectGrades.reduce((sum, s) => sum + s.credits, 0);
    const validatedCredits = subjectGrades
      .filter(s => s.isValidated)
      .reduce((sum, s) => sum + s.credits, 0);

    const semester = semesters.find(s => s.id === semesterId);

    return {
      name: semester?.name || 'Semestre',
      average: semesterAverage,
      validatedCredits,
      totalCredits,
      subjectGrades,
      calculationSystem
    };
  };

  // Calculer les données complètes d'un étudiant (tous semestres)
  const getStudentFullData = (studentId: string) => {
    const sortedSemesters = [...semesters].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    const semester1 = sortedSemesters[0] ? getStudentSemesterData(studentId, sortedSemesters[0].id) : null;
    const semester2 = sortedSemesters[1] ? getStudentSemesterData(studentId, sortedSemesters[1].id) : null;

    let annualAverage = 0;
    let totalValidatedCredits = 0;
    let totalCredits = 0;

    if (semester1 && semester2) {
      annualAverage = (semester1.average + semester2.average) / 2;
      totalValidatedCredits = semester1.validatedCredits + semester2.validatedCredits;
      totalCredits = semester1.totalCredits + semester2.totalCredits;
    } else if (semester1) {
      annualAverage = semester1.average;
      totalValidatedCredits = semester1.validatedCredits;
      totalCredits = semester1.totalCredits;
    } else if (semester2) {
      annualAverage = semester2.average;
      totalValidatedCredits = semester2.validatedCredits;
      totalCredits = semester2.totalCredits;
    }

    return {
      semester1,
      semester2,
      annualAverage,
      totalValidatedCredits,
      totalCredits
    };
  };

  // Grouper les étudiants par classe avec leurs stats
  const studentsByClass = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    students.forEach((student) => {
      const classId = student.class_id;
      if (!grouped[classId]) {
        grouped[classId] = [];
      }
      
      const calculationSystem = getClassCalculationSystem(classId);
      const fullData = getStudentFullData(student.id);
      const currentSemesterData = selectedSemester 
        ? getStudentSemesterData(student.id, selectedSemester)
        : null;
      
      grouped[classId].push({
        ...student,
        calculationSystem,
        average: bulletinType === 'annual' 
          ? fullData.annualAverage 
          : (currentSemesterData?.average || 0),
        validatedCredits: bulletinType === 'annual'
          ? fullData.totalValidatedCredits
          : (currentSemesterData?.validatedCredits || 0),
        totalCredits: bulletinType === 'annual'
          ? fullData.totalCredits
          : (currentSemesterData?.totalCredits || 0),
        fullData
      });
    });
    
    Object.keys(grouped).forEach(classId => {
      grouped[classId].sort((a, b) => b.average - a.average);
    });
    
    return grouped;
  }, [students, grades, subjects, semesters, selectedSemester, bulletinType, cycles]);

  // Générer PDF pour un étudiant
  const handleGeneratePDF = async (student: any) => {
    try {
      const studentClass = classes.find(c => c.id === student.class_id);
      const fullData = getStudentFullData(student.id);
      const calculationSystem = getClassCalculationSystem(student.class_id);
      
      // Récupérer les absences
      const absences = await fetchStudentAbsences(student.id);
      
      // Récupérer infos cycle/option
      const cycle = studentClass?.cycle_id ? cycles.find(c => c.id === studentClass.cycle_id) : null;
      const option = studentClass?.option_id ? options.find(o => o.id === studentClass.option_id) : null;
      
      // Calculer le rang
      const classStudents = studentsByClass[student.class_id] || [];
      const rank = classStudents.findIndex(s => s.id === student.id) + 1;
      
      const extraData: StudentExtraData = {
        cycleName: cycle?.name,
        yearLevel: studentClass?.year_level,
        optionName: option?.name,
        totalAbsences: absences.total,
        justifiedAbsences: absences.justified,
        rank,
        totalStudents: classStudents.length
      };
      
      const studentData = {
        id: student.id,
        firstname: student.firstname,
        lastname: student.lastname,
        email: student.email,
        cin_number: student.cin_number,
        birth_date: student.birth_date,
        class_id: student.class_id,
        school_id: student.school_id,
        classes: studentClass,
        schools: { name: schoolName },
      };

      if (bulletinType === 'annual') {
        const bulletinData: BulletinData = {
          student: studentData,
          semester1: fullData.semester1 || undefined,
          semester2: fullData.semester2 || undefined,
          annualAverage: fullData.annualAverage,
          totalValidatedCredits: fullData.totalValidatedCredits,
          totalCredits: fullData.totalCredits,
          isAnnualBulletin: true,
          calculationSystem,
          settings: bulletinSettings || undefined,
          extraData
        };
        await generateLMDBulletinPdf(bulletinData, logoBase64, academicYear);
      } else {
        const semesterData = selectedSemester 
          ? getStudentSemesterData(student.id, selectedSemester)
          : null;
        
        if (!semesterData) {
          toast.error("Veuillez sélectionner un semestre");
          return;
        }

        const sortedSemesters = [...semesters].sort((a, b) => 
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
        const semesterIndex = sortedSemesters.findIndex(s => s.id === selectedSemester);
        const semesterNumber = (semesterIndex >= 0 ? semesterIndex + 1 : 1) as 1 | 2;

        const bulletinData: BulletinData = {
          student: studentData,
          currentSemester: semesterData,
          semesterNumber,
          isAnnualBulletin: false,
          calculationSystem,
          settings: bulletinSettings || undefined,
          extraData
        };
        await generateLMDBulletinPdf(bulletinData, logoBase64, academicYear);
      }
      
      toast.success("Bulletin généré avec succès");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du bulletin");
    }
  };

  // Générer tous les bulletins d'une classe
  const handleGenerateClassBulletins = async (classId: string) => {
    try {
      const classStudents = studentsByClass[classId] || [];
      if (classStudents.length === 0) {
        toast.error("Aucun étudiant dans cette classe");
        return;
      }

      const doc = new jsPDF();
      const studentClass = classes.find(c => c.id === classId);
      const calculationSystem = getClassCalculationSystem(classId);
      const cycle = studentClass?.cycle_id ? cycles.find(c => c.id === studentClass.cycle_id) : null;
      const option = studentClass?.option_id ? options.find(o => o.id === studentClass.option_id) : null;

      for (let index = 0; index < classStudents.length; index++) {
        const student = classStudents[index];
        if (index > 0) {
          doc.addPage();
        }

        const absences = await fetchStudentAbsences(student.id);
        const extraData: StudentExtraData = {
          cycleName: cycle?.name,
          yearLevel: studentClass?.year_level,
          optionName: option?.name,
          totalAbsences: absences.total,
          justifiedAbsences: absences.justified,
          rank: index + 1,
          totalStudents: classStudents.length
        };

        const studentData = {
          id: student.id,
          firstname: student.firstname,
          lastname: student.lastname,
          email: student.email,
          cin_number: student.cin_number,
          birth_date: student.birth_date,
          class_id: student.class_id,
          school_id: student.school_id,
          classes: studentClass,
          schools: { name: schoolName },
        };

        const fullData = getStudentFullData(student.id);

        if (bulletinType === 'annual') {
          const bulletinData: BulletinData = {
            student: studentData,
            semester1: fullData.semester1 || undefined,
            semester2: fullData.semester2 || undefined,
            annualAverage: fullData.annualAverage,
            totalValidatedCredits: fullData.totalValidatedCredits,
            totalCredits: fullData.totalCredits,
            isAnnualBulletin: true,
            calculationSystem,
            settings: bulletinSettings || undefined,
            extraData
          };
          await generateLMDBulletinInDoc(doc, bulletinData, logoBase64, academicYear);
        } else {
          const semesterData = selectedSemester 
            ? getStudentSemesterData(student.id, selectedSemester)
            : null;
          
          if (semesterData) {
            const sortedSems = [...semesters].sort((a, b) => 
              new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
            );
            const semIdx = sortedSems.findIndex(s => s.id === selectedSemester);
            const semNum = (semIdx >= 0 ? semIdx + 1 : 1) as 1 | 2;

            const bulletinData: BulletinData = {
              student: studentData,
              currentSemester: semesterData,
              semesterNumber: semNum,
              isAnnualBulletin: false,
              calculationSystem,
              settings: bulletinSettings || undefined,
              extraData
            };
            await generateLMDBulletinInDoc(doc, bulletinData, logoBase64, academicYear);
          }
        }
      }

      const className = studentClass?.name || 'Classe';
      const suffix = bulletinType === 'annual' ? 'Annuel' : 'Semestre';
      const fileName = `Bulletins_${className}_${suffix}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      
      toast.success(`${classStudents.length} bulletins générés avec succès`);
    } catch (error) {
      console.error("Erreur génération PDF groupé:", error);
      toast.error("Erreur lors de la génération des bulletins");
    }
  };

  if (loading || loadingSemesters || loadingSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3 text-muted-foreground">Chargement des données...</span>
      </div>
    );
  }

  // Message si aucun semestre configuré
  if (semesters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Bulletins de Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Aucun semestre configuré</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Veuillez configurer des semestres pour l'année scolaire {selectedYear?.name || 'sélectionnée'} dans les paramètres.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vue détaillée d'un étudiant
  if (selectedStudent) {
    const studentClass = classes.find(c => c.id === selectedStudent.class_id);
    const fullData = getStudentFullData(selectedStudent.id);
    const currentSemesterData = selectedSemester 
      ? getStudentSemesterData(selectedStudent.id, selectedSemester)
      : fullData.semester1;


    const classStudents = studentsByClass[selectedStudent.class_id] || [];
    const rank = classStudents.findIndex(s => s.id === selectedStudent.id) + 1;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedStudent(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>
          <Button onClick={() => handleGeneratePDF(selectedStudent)} className="gap-2">
            <Download className="h-4 w-4" />
            Télécharger le Bulletin PDF
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Étudiant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{selectedStudent.firstname} {selectedStudent.lastname}</p>
              <p className="text-sm text-muted-foreground">{studentClass?.name}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold">
                  {(bulletinType === 'annual' ? fullData.annualAverage : (currentSemesterData?.average || 0)).toFixed(2)}
                </p>
                <span className="text-muted-foreground">/20</span>
              </div>
              <Badge variant={(bulletinType === 'annual' ? fullData.annualAverage : (currentSemesterData?.average || 0)) >= 10 ? "default" : "destructive"} className="mt-1">
                {(bulletinType === 'annual' ? fullData.annualAverage : (currentSemesterData?.average || 0)) >= 14 ? "Bien" : (bulletinType === 'annual' ? fullData.annualAverage : (currentSemesterData?.average || 0)) >= 10 ? "Passable" : "Insuffisant"}
              </Badge>
            </CardContent>
          </Card>

          {getClassCalculationSystem(selectedStudent.class_id) === 'credit' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Crédits Validés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-primary">
                    {bulletinType === 'annual' ? fullData.totalValidatedCredits : (currentSemesterData?.validatedCredits || 0)}
                  </p>
                  <span className="text-muted-foreground">/ {bulletinType === 'annual' ? fullData.totalCredits : (currentSemesterData?.totalCredits || 0)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all" 
                    style={{ 
                      width: `${(bulletinType === 'annual' ? fullData.totalCredits : (currentSemesterData?.totalCredits || 0)) > 0 
                        ? ((bulletinType === 'annual' ? fullData.totalValidatedCredits : (currentSemesterData?.validatedCredits || 0)) / (bulletinType === 'annual' ? fullData.totalCredits : (currentSemesterData?.totalCredits || 0))) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Classement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold">{rank}</p>
                <span className="text-muted-foreground">/ {classStudents.length}</span>
              </div>
              {rank <= 3 && <Badge variant="secondary" className="mt-1">Top {rank}</Badge>}
            </CardContent>
          </Card>
        </div>

        {/* Notes par semestre */}
        {bulletinType === 'annual' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {fullData.semester1 && (
              <SemesterGradesCard 
                semesterData={fullData.semester1} 
                title="Semestre 1" 
              />
            )}
            {fullData.semester2 && (
              <SemesterGradesCard 
                semesterData={fullData.semester2} 
                title="Semestre 2" 
              />
            )}
          </div>
        )}

        {bulletinType === 'semester' && currentSemesterData && (
          <SemesterGradesCard 
            semesterData={currentSemesterData} 
            title={currentSemesterData.name} 
          />
        )}
      </div>
    );
  }

  // Vue liste principale
  return (
    <div className="space-y-6">
      <BulletinSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={bulletinSettings}
        loading={loadingSettings}
        onUpdate={updateSettings}
      />
      
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Bulletins de Notes
              </CardTitle>
              <CardDescription className="mt-2">
                Consultez et téléchargez les bulletins de notes
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)} title="Paramètres">
                <Settings className="h-4 w-4" />
              </Button>
              
              <Select value={bulletinType} onValueChange={(v: 'semester' | 'annual') => setBulletinType(v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semester">Semestriel</SelectItem>
                  <SelectItem value="annual">Annuel</SelectItem>
                </SelectContent>
              </Select>

              {bulletinType === 'semester' && (
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sélectionner semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem.id} value={sem.id}>
                        {sem.name} {sem.is_actual && "(Actuel)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={classes[0]?.id} className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              {classes.map((classItem) => (
                <TabsTrigger key={classItem.id} value={classItem.id} className="gap-2">
                  {classItem.name}
                  <Badge variant="secondary" className="ml-1">
                    {studentsByClass[classItem.id]?.length || 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {classes.map((classItem) => {
              const classCalcSystem = getClassCalculationSystem(classItem.id);
              const isCredit = classCalcSystem === 'credit';
              
              return (
                <TabsContent key={classItem.id} value={classItem.id} className="space-y-4">
                  {studentsByClass[classItem.id]?.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{studentsByClass[classItem.id].length} étudiants</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {isCredit ? 'Système Crédits' : 'Système Coefficients'}
                          </Badge>
                        </div>
                        <Button onClick={() => handleGenerateClassBulletins(classItem.id)} className="gap-2">
                          <Download className="h-4 w-4" />
                          Télécharger tous les bulletins
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {studentsByClass[classItem.id].map((student, index) => (
                          <Card 
                            key={student.id} 
                            className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <CardTitle className="text-base truncate flex items-center gap-2">
                                    {student.firstname} {student.lastname}
                                    {index < 3 && (
                                      <Badge variant={index === 0 ? "default" : "secondary"} className="h-5">
                                        #{index + 1}
                                      </Badge>
                                    )}
                                  </CardTitle>
                                  <CardDescription className="text-xs truncate mt-1">
                                    {student.cin_number || 'N/A'}
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-sm font-medium text-muted-foreground">Moyenne</span>
                                <span className="text-lg font-bold">
                                  {student.average > 0 ? student.average.toFixed(2) : '--'}/20
                                </span>
                              </div>
                              {isCredit && (
                                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    Crédits
                                  </span>
                                  <span className="text-lg font-bold text-primary">
                                    {student.validatedCredits}/{student.totalCredits}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Aucun étudiant</h3>
                      <p className="text-sm text-muted-foreground">
                        Aucun étudiant dans cette classe
                      </p>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Composant pour afficher les notes d'un semestre
const SemesterGradesCard = ({ semesterData, title }: { semesterData: SemesterData; title: string }) => {
  const isCredit = semesterData.calculationSystem === 'credit';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-4 text-sm font-normal">
            <span>Moyenne: <strong>{semesterData.average.toFixed(2)}/20</strong></span>
            {isCredit && (
              <Badge variant="outline" className="gap-1">
                <GraduationCap className="h-3 w-3" />
                {semesterData.validatedCredits}/{semesterData.totalCredits} crédits
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {semesterData.subjectGrades.map((subject) => (
            <div 
              key={subject.subjectId} 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isCredit 
                  ? (subject.isValidated 
                      ? 'bg-green-500/5 border-green-500/20' 
                      : subject.hasGrades 
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-muted/50 border-muted')
                  : 'bg-muted/50 border-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                {isCredit && (
                  subject.isValidated ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : subject.hasGrades ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <div className="h-4 w-4" />
                  )
                )}
                <span className="font-medium">{subject.subjectName}</span>
                <Badge variant="secondary" className="text-xs">
                  {isCredit 
                    ? `${subject.credits} crédit${subject.credits > 1 ? 's' : ''}`
                    : `Coef. ${subject.coefficient}`
                  }
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold ${
                  !subject.hasGrades ? 'text-muted-foreground' :
                  isCredit ? (subject.isValidated ? 'text-green-700' : 'text-red-700') : ''
                }`}>
                  {subject.hasGrades && subject.average !== undefined 
                    ? `${subject.average.toFixed(2)}/20` 
                    : '-'}
                </span>
                {isCredit && (
                  <Badge variant={subject.isValidated ? "default" : subject.hasGrades ? "destructive" : "secondary"}>
                    {subject.isValidated ? 'Validé' : subject.hasGrades ? 'Non validé' : 'Pas de note'}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
