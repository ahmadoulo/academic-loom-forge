import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAggregatedStats } from "@/hooks/useAggregatedStats";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useSchoolStats } from "@/hooks/useSchoolStats";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Building2, Users, GraduationCap, BookOpen, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(142 76% 36%)',
  warning: 'hsl(38 92% 50%)',
  destructive: 'hsl(var(--destructive))',
  accent: 'hsl(var(--accent))',
};

export function AdminAnalyticsDashboard() {
  const { stats, loading } = useAggregatedStats();
  const { schools } = useSchools();
  const { subscriptions } = useSubscriptions();
  const { plans } = useSubscriptionPlans();

  const subscriptionData = [
    { name: 'Basic', value: stats.subscriptionsByPlan.basic, color: COLORS.warning },
    { name: 'Standard', value: stats.subscriptionsByPlan.standard, color: COLORS.primary },
    { name: 'Premium', value: stats.subscriptionsByPlan.premium, color: COLORS.success },
  ];

  const schoolStatusData = [
    { status: 'Actives', count: stats.schoolsByStatus.active, fill: COLORS.success },
    { status: 'Inactives', count: stats.schoolsByStatus.inactive, fill: 'hsl(var(--muted))' },
    { status: 'Essai', count: stats.schoolsByStatus.trial, fill: COLORS.warning },
    { status: 'Expirées', count: stats.schoolsByStatus.expired, fill: COLORS.destructive },
  ];

  if (loading) {
    return <div className="p-6">Chargement des statistiques...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Consommation</h2>
        <p className="text-muted-foreground mt-1">
          Vue détaillée de la performance de votre plateforme
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Écoles Totales</p>
                <p className="text-2xl font-bold mt-1">{stats.totalSchools}</p>
                <p className="text-xs text-success mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stats.activeSchools} actives
                </p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Étudiants Totaux</p>
                <p className="text-2xl font-bold mt-1">{stats.totalStudents}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Toutes écoles
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Professeurs Totaux</p>
                <p className="text-2xl font-bold mt-1">{stats.totalTeachers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Actifs
                </p>
              </div>
              <Users className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Classes Totales</p>
                <p className="text-2xl font-bold mt-1">{stats.totalClasses}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalSubjects} matières
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscription Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Distribution des Abonnements</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* School Status */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Statut des Écoles</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={schoolStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {schoolStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* School Consumption Details */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Consommation par École
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schools.map(school => (
              <SchoolConsumptionRow 
                key={school.id} 
                schoolId={school.id} 
                schoolName={school.name}
                subscriptions={subscriptions}
                plans={plans}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SchoolConsumptionRow({ 
  schoolId, 
  schoolName,
  subscriptions,
  plans
}: { 
  schoolId: string; 
  schoolName: string;
  subscriptions: any[];
  plans: any[];
}) {
  const { stats, loading } = useSchoolStats(schoolId);
  const subscription = subscriptions.find(s => s.school_id === schoolId);

  if (loading) {
    return (
      <div className="p-4 border border-border rounded-lg animate-pulse bg-muted/20">
        <div className="h-4 bg-muted rounded w-1/3"></div>
      </div>
    );
  }

  // Get limits from custom limits or plan limits
  const plan = plans.find(p => p.type === subscription?.plan_type);
  const studentLimit = subscription?.custom_student_limit || plan?.student_limit || 0;
  const teacherLimit = subscription?.custom_teacher_limit || plan?.teacher_limit || 0;

  const studentUsage = studentLimit > 0 ? (stats.studentsCount / studentLimit) * 100 : 0;
  const teacherUsage = teacherLimit > 0 ? (stats.teachersCount / teacherLimit) * 100 : 0;

  const getStatusColor = (usage: number) => {
    if (usage >= 90) return 'text-destructive';
    if (usage >= 70) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold">{schoolName}</h4>
          {subscription && (
            <Badge variant="outline" className="mt-1 capitalize">
              {subscription.plan_type}
            </Badge>
          )}
        </div>
        <div className="text-right text-sm">
          <div className="text-muted-foreground">Classes: {stats.classesCount}</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Étudiants</span>
            <span className={`font-medium ${getStatusColor(studentUsage)}`}>
              {stats.studentsCount} / {studentLimit || '∞'}
            </span>
          </div>
          {studentLimit > 0 && (
            <Progress value={Math.min(studentUsage, 100)} className="h-2" />
          )}
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Professeurs</span>
            <span className={`font-medium ${getStatusColor(teacherUsage)}`}>
              {stats.teachersCount} / {teacherLimit || '∞'}
            </span>
          </div>
          {teacherLimit > 0 && (
            <Progress value={Math.min(teacherUsage, 100)} className="h-2" />
          )}
        </div>
      </div>
    </div>
  );
}
