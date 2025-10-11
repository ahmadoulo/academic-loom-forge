import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useAttendance } from "@/hooks/useAttendance";
import { useSubjects } from "@/hooks/useSubjects";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
// import { exportAttendanceToPdf } from "@/utils/attendancePdfExport";
import { Badge } from "@/components/ui/badge";

interface SchoolAttendanceViewProps {
  schoolId: string;
}

export function SchoolAttendanceView({ schoolId }: SchoolAttendanceViewProps) {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { classes } = useClasses(schoolId);
  const { students } = useStudents(schoolId);
  const { subjects } = useSubjects(schoolId);
  const { attendance, loading } = useAttendance(
    selectedClass, 
    undefined, 
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
    undefined,
    selectedSubject || undefined
  );

  const classData = classes.find(c => c.id === selectedClass);
  const classStudents = students.filter(s => s.class_id === selectedClass);
  const classSubjects = subjects.filter(s => s.class_id === selectedClass);

  const handleExportPdf = () => {
    // TODO: Implement PDF export with subject filtering
    console.log('Export PDF for class:', classData?.name, 'Subject:', selectedSubject);
  };

  const presentCount = classStudents.filter(s => 
    attendance.find(a => a.student_id === s.id && a.status === 'present')
  ).length;
  
  const absentCount = classStudents.filter(s => 
    !attendance.find(a => a.student_id === s.id && a.status === 'present')
  ).length;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Présences et Absences par Matière
          </span>
          {selectedClass && (
            <Button onClick={handleExportPdf} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Classe</label>
            <Select value={selectedClass} onValueChange={(value) => {
              setSelectedClass(value);
              setSelectedSubject(""); // Reset subject when class changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Matière</label>
            <Select 
              value={selectedSubject} 
              onValueChange={setSelectedSubject}
              disabled={!selectedClass}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les matières" />
              </SelectTrigger>
              <SelectContent>
                {classSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP', { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={fr}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {selectedClass && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-success">{presentCount}</div>
                <div className="text-sm text-muted-foreground">Présents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">{absentCount}</div>
                <div className="text-sm text-muted-foreground">Absents</div>
              </div>
            </div>
          </div>
        )}

        {selectedClass && !loading && (
          <div className="space-y-2">
            <h3 className="font-semibold">Liste des étudiants</h3>
            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {classStudents.map((student) => {
                const record = attendance.find(a => a.student_id === student.id);
                const isPresent = record?.status === 'present';
                
                return (
                  <div
                    key={student.id}
                    className="p-3 flex items-center justify-between hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-2">
                      <span>{student.firstname} {student.lastname}</span>
                      {record?.subjects && (
                        <Badge variant="outline" className="text-xs">
                          {record.subjects.name}
                        </Badge>
                      )}
                      {record?.assignments && (
                        <Badge variant="secondary" className="text-xs">
                          {record.assignments.title}
                        </Badge>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isPresent 
                        ? 'bg-success/20 text-success' 
                        : 'bg-destructive/20 text-destructive'
                    }`}>
                      {isPresent ? 'Présent' : 'Absent'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!selectedClass && (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sélectionnez une classe pour voir les présences</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}