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
  performanceBySubject?: Array<{ subject: string; average: number; trend: 'up' | 'down' | 'stable' }>;
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
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne Générale</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageGrade}/20</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.averageGrade >= 12 ? (
                <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
              )}
              Performance globale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.successRate >= 80 ? (
                <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
              )}
              Étudiants avec moyenne ≥ 10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assiduité</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.attendanceRate >= 90 ? (
                <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
              )}
              Taux de présence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.studentsInDifficulty}</div>
            <p className="text-xs text-muted-foreground">
              Étudiants avec moyenne &lt; 10
            </p>
          </CardContent>
        </Card>
      </div>

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
              <CardDescription>Moyennes et tendances par matière</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceBySubject.length > 0 ? performanceBySubject.map((subject) => (
                  <div key={subject.subject} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{subject.subject}</p>
                        <p className="text-sm text-muted-foreground">Moyenne: {subject.average}/20</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(subject.average / 20) * 100} className="w-20" />
                      {subject.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {subject.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {subject.trend === 'stable' && <div className="h-4 w-4 rounded-full bg-gray-400" />}
                    </div>
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
              <CardDescription>Taux de présence mensuel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recommandations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Performance en hausse</p>
                    <p className="text-xs text-muted-foreground">Les résultats en mathématiques s'améliorent</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Attention requise</p>
                    <p className="text-xs text-muted-foreground">3 étudiants ont des difficultés en français</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Excellente participation</p>
                    <p className="text-xs text-muted-foreground">Taux de participation élevé cette semaine</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Étudiants à Suivre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Marie Dupont</p>
                    <p className="text-sm text-muted-foreground">Baisse en mathématiques</p>
                  </div>
                  <Badge variant="destructive">Critique</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Jean Martin</p>
                    <p className="text-sm text-muted-foreground">Absences répétées</p>
                  </div>
                  <Badge variant="outline">À surveiller</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sophie Moreau</p>
                    <p className="text-sm text-muted-foreground">Progrès remarquable</p>
                  </div>
                  <Badge variant="default">Excellence</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};