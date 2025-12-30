import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, BookOpen, Award, AlertTriangle } from "lucide-react";

interface AnalyticsDashboardProps {
  schoolId?: string;
  teacherId?: string;
  classId?: string;
  performanceBySubject?: Array<{ 
    subject: string; 
    subjectId?: string;
    average: number; 
    trend: 'up' | 'down' | 'stable';
    teacherName?: string;
    byClass?: Array<{
      classId: string;
      className: string;
      average: number;
      totalGrades: number;
      teacherName: string;
    }>;
  }>;
  attendanceByMonth?: Array<{ month: string; rate: number }>;
  gradeDistribution?: Array<{ grade: string; count: number; color: string }>;
  overallStats?: {
    averageGrade: number;
    successRate: number;
    attendanceRate: number;
    studentsInDifficulty: number;
  };
}

export const AnalyticsDashboard = ({ 
  schoolId, 
  teacherId, 
  classId,
  performanceBySubject = [],
  attendanceByMonth = [],
  gradeDistribution = [],
  overallStats = {
    averageGrade: 0,
    successRate: 0,
    attendanceRate: 0,
    studentsInDifficulty: 0
  }
}: AnalyticsDashboardProps) => {
  return (
    <div className="space-y-6">

      {/* Charts and Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance par Matière</TabsTrigger>
          <TabsTrigger value="attendance">Assiduité</TabsTrigger>
          <TabsTrigger value="distribution">Distribution des Notes</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance par Matière</CardTitle>
              <CardDescription>Moyennes par matière et par classe avec le professeur assigné</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performanceBySubject.length > 0 ? performanceBySubject.map((subject) => (
                  <div key={subject.subject} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold">{subject.subject}</p>
                          {subject.teacherName && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Prof: {subject.teacherName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`text-lg font-bold ${
                            subject.average >= 14 ? 'text-green-600' :
                            subject.average >= 10 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {subject.average}/20
                          </span>
                          <p className="text-xs text-muted-foreground">Moyenne globale</p>
                        </div>
                        {subject.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {subject.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        {subject.trend === 'stable' && <div className="h-4 w-4 rounded-full bg-gray-400" />}
                      </div>
                    </div>
                    
                    {subject.byClass && subject.byClass.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Détail par classe</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {subject.byClass.map((classData) => (
                            <div 
                              key={classData.classId} 
                              className="flex items-center justify-between p-2 bg-accent/30 rounded-lg text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{classData.className}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {classData.teacherName}
                                </p>
                              </div>
                              <div className="ml-2 shrink-0">
                                <span className={`font-bold ${
                                  classData.average >= 14 ? 'text-green-600' :
                                  classData.average >= 10 ? 'text-amber-600' :
                                  'text-red-600'
                                }`}>
                                  {classData.average}/20
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="text-muted-foreground text-center py-4">Aucune donnée disponible</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution de l'Assiduité</CardTitle>
              <CardDescription>Taux de présence mensuel basé sur les données réelles</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, 'Taux de présence']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-3 opacity-50" />
                  <p className="font-medium">Aucune donnée d'assiduité</p>
                  <p className="text-sm">Les données apparaîtront après l'enregistrement des présences</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribution des Notes</CardTitle>
              <CardDescription>Répartition des étudiants par tranche de notes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {gradeDistribution.map((item) => (
                    <div key={item.grade} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.grade}</span>
                      </div>
                      <Badge variant="outline">{item.count} étudiants</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse et Recommandations</CardTitle>
              <CardDescription>Insights basés sur les données réelles de l'établissement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Analyse de la performance globale */}
              {overallStats.averageGrade >= 14 ? (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Excellente performance globale</p>
                    <p className="text-xs text-muted-foreground">
                      La moyenne générale de {overallStats.averageGrade}/20 indique d'excellents résultats
                    </p>
                  </div>
                </div>
              ) : overallStats.averageGrade >= 12 ? (
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Bonne performance générale</p>
                    <p className="text-xs text-muted-foreground">
                      Moyenne de {overallStats.averageGrade}/20 - Continuez sur cette lancée
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Amélioration nécessaire</p>
                    <p className="text-xs text-muted-foreground">
                      Moyenne de {overallStats.averageGrade}/20 - Un soutien pédagogique serait bénéfique
                    </p>
                  </div>
                </div>
              )}

              {/* Analyse du taux de réussite */}
              {overallStats.successRate >= 80 ? (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <Award className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Excellent taux de réussite</p>
                    <p className="text-xs text-muted-foreground">
                      {overallStats.successRate}% des étudiants ont une moyenne ≥ 10
                    </p>
                  </div>
                </div>
              ) : overallStats.successRate >= 60 ? (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Attention requise</p>
                    <p className="text-xs text-muted-foreground">
                      {overallStats.studentsInDifficulty} étudiants en difficulté - Un accompagnement est recommandé
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Intervention urgente</p>
                    <p className="text-xs text-muted-foreground">
                      Taux de réussite faible ({overallStats.successRate}%) - Action immédiate nécessaire
                    </p>
                  </div>
                </div>
              )}

              {/* Analyse de l'assiduité */}
              {overallStats.attendanceRate >= 90 ? (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Excellente assiduité</p>
                    <p className="text-xs text-muted-foreground">
                      Taux de présence de {overallStats.attendanceRate}% - À maintenir
                    </p>
                  </div>
                </div>
              ) : overallStats.attendanceRate >= 75 ? (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Assiduité à surveiller</p>
                    <p className="text-xs text-muted-foreground">
                      Taux de présence de {overallStats.attendanceRate}% - Sensibilisation recommandée
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Absentéisme préoccupant</p>
                    <p className="text-xs text-muted-foreground">
                      Taux de présence faible ({overallStats.attendanceRate}%) - Mesures urgentes
                    </p>
                  </div>
                </div>
              )}

              {/* Analyse des matières */}
              {performanceBySubject.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Points forts et faibles par matière</p>
                    <p className="text-xs text-muted-foreground">
                      {performanceBySubject.filter(s => s.average >= 14).length} matières excellentes, {' '}
                      {performanceBySubject.filter(s => s.average < 10).length} nécessitent un renforcement
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};