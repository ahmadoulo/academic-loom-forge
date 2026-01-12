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
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import {
  useAdministrativeDocuments,
  useStudentsWithDocuments,
  useClassesWithCycles,
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

  const { data: classes, isLoading: loadingClasses } = useClassesWithCycles(schoolId);
  const { documentTypes, loadingTypes, refetchTypes } = useAdministrativeDocuments(schoolId);
  const { 
    data: students, 
    isLoading: loadingStudents, 
    refetch: refetchStudents 
  } = useStudentsWithDocuments(
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
        s.email?.toLowerCase().includes(query) ||
        s.class_name.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!students) return { total: 0, complete: 0, incomplete: 0, percentage: 0, withDocs: 0 };

    const total = students.length;
    const withDocs = students.filter(s => s.totalRequired > 0).length;
    const complete = students.filter((s) => s.missingCount === 0 && s.totalRequired > 0).length;
    const incomplete = withDocs - complete;
    const percentage = withDocs > 0 ? Math.round((complete / withDocs) * 100) : 0;

    return { total, complete, incomplete, percentage, withDocs };
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

  const handleRefresh = () => {
    refetchStudents();
    refetchTypes();
  };

  // Filter classes that have a cycle assigned (only those can have document types)
  const classesWithCycles = useMemo(() => {
    return (classes || []).filter(c => c.cycle_id);
  }, [classes]);

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
            <p className="text-xs text-muted-foreground mt-1">
              {stats.withDocs} avec documents requis
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dossiers Complets</CardTitle>
            <FileCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.complete}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tous documents acquis
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dossiers Incomplets</CardTitle>
            <FileX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.incomplete}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Documents manquants
            </p>
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

      {/* Info Banner if no document types */}
      {!loadingTypes && documentTypes.length === 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Aucun type de document configuré
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Allez dans l'onglet "Types de Documents" pour créer les documents requis par cycle.
                  Les étudiants afficheront 0/0 tant qu'aucun document n'est configuré pour leur cycle.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un étudiant (nom, email, CIN)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={selectedClassId || "all"}
              onValueChange={(v) => setSelectedClassId(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classesWithCycles.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <div className="flex items-center gap-2">
                      <span>{cls.name}</span>
                      {cls.year_level && (
                        <span className="text-xs text-muted-foreground">
                          (Année {cls.year_level})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-background">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="missing-only" className="text-sm cursor-pointer whitespace-nowrap">
                Manquants seulement
              </Label>
              <Switch
                id="missing-only"
                checked={showMissingOnly}
                onCheckedChange={setShowMissingOnly}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
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
              <p className="text-muted-foreground text-sm mt-1 max-w-md px-4">
                {selectedClassId || searchQuery || showMissingOnly
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Aucun étudiant inscrit dans les classes ayant un cycle configuré"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Classe / Cycle</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {student.lastname} {student.firstname}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {student.cin_number && (
                            <span className="text-xs text-muted-foreground">
                              CIN: {student.cin_number}
                            </span>
                          )}
                          {student.email && (
                            <span className="text-xs text-muted-foreground">
                              {student.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">{student.class_name}</Badge>
                        {student.cycle_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <GraduationCap className="h-3 w-3" />
                            <span>{student.cycle_name}</span>
                            {student.year_level && (
                              <span className="ml-1">• Année {student.year_level}</span>
                            )}
                          </div>
                        )}
                      </div>
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
                        <span className="text-sm font-medium">
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
                        variant="outline"
                        size="sm"
                        className="gap-2 opacity-70 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Eye className="h-4 w-4" />
                        Gérer
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
