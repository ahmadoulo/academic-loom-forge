import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchools } from "@/hooks/useSchools";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSchoolStats } from "@/hooks/useSchoolStats";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Building2, Users, GraduationCap, BookOpen, TrendingUp, AlertCircle } from "lucide-react";
import { useMemo } from "react";

const COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  accent: 'hsl(var(--accent))',
};

export function AdminAnalyticsDashboard() {
  const { schools } = useSchools();
  const { subscriptions } = useSubscriptions();

  // Calculate aggregated stats across all schools
  const aggregatedStats = useMemo(() => {
    let totalStudents = 0;
    let totalTeachers = 0;
    let totalClasses = 0;
    let totalSubjects = 0;

    schools.forEach(school => {
      // We'll fetch individual school stats
      const schoolStats = { studentsCount: 0, teachersCount: 0, classesCount: 0, subjectsCount: 0 };
      totalStudents += schoolStats.studentsCount;
      totalTeachers += schoolStats.teachersCount;
      totalClasses += schoolStats.classesCount;
      totalSubjects += schoolStats.subjectsCount;
    });

    return { totalStudents, totalTeachers, totalClasses, totalSubjects };
  }, [schools]);

  // Subscription distribution data
  const subscriptionData = useMemo(() => {
    const planCounts = {
      basic: 0,
      standard: 0,
      premium: 0
    };

    subscriptions.forEach(sub => {
      if (sub.status === 'active' || sub.status === 'trial') {
        planCounts[sub.plan_type]++;
      }
    });

    return [
      { name: 'Basic', value: planCounts.basic, color: COLORS.warning },
      { name: 'Standard', value: planCounts.standard, color: COLORS.primary },
      { name: 'Premium', value: planCounts.premium, color: COLORS.success },
    ];
  }, [subscriptions]);

  // School consumption by status
  const schoolStatusData = useMemo(() => {
    const activeCount = schools.filter(s => s.is_active).length;
    const inactiveCount = schools.filter(s => !s.is_active).length;
    const trialCount = subscriptions.filter(s => s.is_trial && s.status === 'trial').length;
    const expiredCount = subscriptions.filter(s => s.status === 'expired').length;

    return [
      { status: 'Actives', count: activeCount },
      { status: 'Inactives', count: inactiveCount },
      { status: 'Essai', count: trialCount },
      { status: 'Expirées', count: expiredCount },
    ];
  }, [schools, subscriptions]);

  // Revenue by plan type
  const revenueByPlan = useMemo(() => {
    const revenue = {
      basic: 0,
      standard: 0,
      premium: 0
    };

    subscriptions
      .filter(sub => !sub.is_trial && sub.amount)
      .forEach(sub => {
        revenue[sub.plan_type] += sub.amount || 0;
      });

    return [
      { plan: 'Basic', revenue: revenue.basic },
      { plan: 'Standard', revenue: revenue.standard },
      { plan: 'Premium', revenue: revenue.premium },
    ];
  }, [subscriptions]);

  // Monthly subscription trends (mock data - would be real historical data)
  const monthlyTrends = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, idx) => ({
      month,
      subscriptions: Math.floor(Math.random() * 20) + 10,
      revenue: Math.floor(Math.random() * 50000) + 20000,
    }));
  }, []);

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
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Écoles Totales</p>
                <p className="text-2xl font-bold mt-1">{schools.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {schools.filter(s => s.is_active).length} actives
                </p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Étudiants Totaux</p>
                <p className="text-2xl font-bold mt-1">{aggregatedStats.totalStudents}</p>
                <p className="text-xs text-success mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Toutes écoles
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Professeurs Totaux</p>
                <p className="text-2xl font-bold mt-1">{aggregatedStats.totalTeachers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Actifs sur la plateforme
                </p>
              </div>
              <Users className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Classes Totales</p>
                <p className="text-2xl font-bold mt-1">{aggregatedStats.totalClasses}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {aggregatedStats.totalSubjects} matières
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
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
                <Bar dataKey="count" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Plan */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Revenus par Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByPlan}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="plan" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Bar dataKey="revenue" fill={COLORS.success} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Tendances Mensuelles</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="subscriptions" 
                  stroke={COLORS.primary} 
                  strokeWidth={2} 
                  name="Abonnements"
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={COLORS.success} 
                  strokeWidth={2} 
                  name="Revenus (MAD)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* School Consumption Details */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Détails de Consommation par École
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schools.slice(0, 10).map(school => (
              <SchoolConsumptionRow key={school.id} schoolId={school.id} schoolName={school.name} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SchoolConsumptionRow({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  const { stats, loading } = useSchoolStats(schoolId);
  const { subscriptions } = useSubscriptions();

  const subscription = subscriptions.find(s => s.school_id === schoolId);

  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 border border-border rounded-lg animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-1/4"></div>
      </div>
    );
  }

  const studentLimit = subscription?.plan_type ? 
    ({ basic: 100, standard: 300, premium: 1000 }[subscription.plan_type]) : 0;
  const teacherLimit = subscription?.plan_type ?
    ({ basic: 20, standard: 50, premium: 200 }[subscription.plan_type]) : 0;

  const studentUsage = studentLimit > 0 ? (stats.studentsCount / studentLimit) * 100 : 0;
  const teacherUsage = teacherLimit > 0 ? (stats.teachersCount / teacherLimit) * 100 : 0;

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors">
      <div className="flex-1">
        <h4 className="font-medium">{schoolName}</h4>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          <span>Étudiants: {stats.studentsCount}/{studentLimit || '∞'}</span>
          <span>Professeurs: {stats.teachersCount}/{teacherLimit || '∞'}</span>
          <span>Classes: {stats.classesCount}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          studentUsage > 90 ? 'bg-destructive/10 text-destructive' :
          studentUsage > 70 ? 'bg-warning/10 text-warning' :
          'bg-success/10 text-success'
        }`}>
          {studentUsage.toFixed(0)}% étudiants
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          teacherUsage > 90 ? 'bg-destructive/10 text-destructive' :
          teacherUsage > 70 ? 'bg-warning/10 text-warning' :
          'bg-success/10 text-success'
        }`}>
          {teacherUsage.toFixed(0)}% profs
        </div>
      </div>
    </div>
  );
}
