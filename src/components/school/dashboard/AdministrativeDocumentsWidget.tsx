import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileCheck,
  FileX,
  FolderOpen,
  AlertTriangle,
  ChevronRight,
  Users,
} from "lucide-react";

interface ClassDocumentStats {
  classId: string;
  className: string;
  totalStudents: number;
  studentsWithRequirements: number;
  completeCount: number;
  incompleteCount: number;
  totalMissingDocs: number;
  completionRate: number;
}

interface AdministrativeDocumentsWidgetProps {
  data: ClassDocumentStats[];
  loading?: boolean;
  onViewDetails?: () => void;
}

export function AdministrativeDocumentsWidget({
  data,
  loading = false,
  onViewDetails,
}: AdministrativeDocumentsWidgetProps) {
  // Calculate overall stats
  const overallStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalStudents: 0,
        studentsWithReqs: 0,
        completeCount: 0,
        incompleteCount: 0,
        totalMissingDocs: 0,
        overallCompletionRate: 0,
      };
    }

    const totalStudents = data.reduce((sum, c) => sum + c.totalStudents, 0);
    const studentsWithReqs = data.reduce((sum, c) => sum + c.studentsWithRequirements, 0);
    const completeCount = data.reduce((sum, c) => sum + c.completeCount, 0);
    const incompleteCount = data.reduce((sum, c) => sum + c.incompleteCount, 0);
    const totalMissingDocs = data.reduce((sum, c) => sum + c.totalMissingDocs, 0);
    const overallCompletionRate = studentsWithReqs > 0
      ? Math.round((completeCount / studentsWithReqs) * 100)
      : 100;

    return {
      totalStudents,
      studentsWithReqs,
      completeCount,
      incompleteCount,
      totalMissingDocs,
      overallCompletionRate,
    };
  }, [data]);

  // Sort classes by completion rate (lowest first - most urgent)
  const sortedClasses = useMemo(() => {
    return [...data]
      .filter(c => c.studentsWithRequirements > 0)
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 5); // Show top 5 most critical
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return "text-emerald-600";
    if (rate >= 50) return "text-amber-600";
    return "text-destructive";
  };

  const getCompletionBadge = (rate: number) => {
    if (rate >= 80) return "default";
    if (rate >= 50) return "warning";
    return "destructive";
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return "bg-emerald-500";
    if (rate >= 50) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Dossiers Administratifs
          </CardTitle>
          {onViewDetails && (
            <Button variant="ghost" size="sm" onClick={onViewDetails} className="gap-1 text-xs">
              Voir détails
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <FileCheck className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {overallStats.completeCount}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">Complets</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <FileX className="h-5 w-5 mx-auto text-destructive mb-1" />
            <p className="text-xl font-bold text-destructive">
              {overallStats.incompleteCount}
            </p>
            <p className="text-xs text-destructive/80">Incomplets</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 mx-auto text-amber-600 mb-1" />
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
              {overallStats.totalMissingDocs}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Docs manquants</p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taux de complétion global</span>
            <span className={`font-bold ${getCompletionColor(overallStats.overallCompletionRate)}`}>
              {overallStats.overallCompletionRate}%
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all ${getProgressColor(overallStats.overallCompletionRate)}`}
              style={{ width: `${overallStats.overallCompletionRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {overallStats.completeCount} sur {overallStats.studentsWithReqs} étudiants avec dossier complet
          </p>
        </div>

        {/* Classes needing attention */}
        {sortedClasses.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Classes à surveiller
            </p>
            <div className="space-y-2">
              {sortedClasses.map((cls) => (
                <div
                  key={cls.classId}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{cls.className}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getCompletionBadge(cls.completionRate) as any}
                      className="text-xs"
                    >
                      {cls.completionRate}%
                    </Badge>
                    {cls.incompleteCount > 0 && (
                      <span className="text-xs text-destructive font-medium">
                        {cls.incompleteCount} inc.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune donnée disponible</p>
            <p className="text-xs">Configurez les types de documents requis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
