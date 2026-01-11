import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Search,
  Loader2,
  Users,
  FileCheck,
  FileX,
  AlertCircle,
  Filter,
  Eye,
} from "lucide-react";
import { useClasses } from "@/hooks/useClasses";
import {
  useAdministrativeDocuments,
  useStudentsWithDocuments,
  StudentWithDocuments,
} from "@/hooks/useAdministrativeDocuments";
import { StudentDocumentDialog } from "./StudentDocumentDialog";

interface StudentDocumentsTrackingProps {
  schoolId: string;
  canEdit?: boolean;
}

export function StudentDocumentsTracking({
  schoolId,
  canEdit = true,
}: StudentDocumentsTrackingProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDocuments | null>(null);

  const { classes, loading: loadingClasses } = useClasses(schoolId);
  const { documentTypes, loadingTypes } = useAdministrativeDocuments(schoolId);
  const { data: students, isLoading: loadingStudents } = useStudentsWithDocuments(
    schoolId,
    selectedClassId || undefined,
    showMissingOnly
  );

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchQuery) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.firstname.toLowerCase().includes(query) ||
        s.lastname.toLowerCase().includes(query) ||
        s.cin_number?.toLowerCase().includes(query) ||
        s.class_name.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!students) return { total: 0, complete: 0, incomplete: 0, percentage: 0 };

    const total = students.length;
    const complete = students.filter((s) => s.missingCount === 0 && s.totalRequired > 0).length;
    const incomplete = total - complete;
    const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;

    return { total, complete, incomplete, percentage };
  }, [students]);

  const isLoading = loadingClasses || loadingTypes || loadingStudents;

  const getStatusColor = (student: StudentWithDocuments) => {
    if (student.totalRequired === 0) return "secondary";
    if (student.missingCount === 0) return "default";
    if (student.totalAcquired > 0) return "warning";
    return "destructive";
  };

  const getStatusText = (student: StudentWithDocuments) => {
    if (student.totalRequired === 0) return "Aucun doc requis";
    if (student.missingCount === 0) return "Complet";
    return `${student.missingCount} manquant(s)`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Étudiants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dossiers Complets</CardTitle>
            <FileCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.complete}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dossiers Incomplets</CardTitle>
            <FileX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.incomplete}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Complétion</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.percentage}%</div>
            <Progress value={stats.percentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un étudiant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={selectedClassId}
              onValueChange={setSelectedClassId}
            >
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-background">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="missing-only" className="text-sm cursor-pointer">
                Documents manquants
              </Label>
              <Switch
                id="missing-only"
                checked={showMissingOnly}
                onCheckedChange={setShowMissingOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg">Aucun étudiant trouvé</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {selectedClassId || searchQuery || showMissingOnly
                  ? "Essayez de modifier vos filtres"
                  : "Aucun étudiant inscrit dans cette école"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {student.lastname} {student.firstname}
                        </p>
                        {student.cin_number && (
                          <p className="text-sm text-muted-foreground">
                            {student.cin_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.class_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            student.totalRequired > 0
                              ? (student.totalAcquired / student.totalRequired) * 100
                              : 0
                          }
                          className="w-20 h-2"
                        />
                        <span className="text-sm text-muted-foreground">
                          {student.totalAcquired}/{student.totalRequired}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(student) as any}>
                        {getStatusText(student)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Eye className="h-4 w-4" />
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Student Document Dialog */}
      {selectedStudent && (
        <StudentDocumentDialog
          student={selectedStudent}
          documentTypes={documentTypes}
          schoolId={schoolId}
          canEdit={canEdit}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
