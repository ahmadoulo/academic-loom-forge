import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen,
  GraduationCap,
  Target
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface EnhancedDashboardChartsProps {
  performanceBySubject: Array<{ subject: string; average: number; count: number }>;
  attendanceByMonth: Array<{ month: string; present: number; absent: number }>;
  gradeDistribution: Array<{ range: string; count: number }>;
  admissionStats: {
    nouveau: number;
    en_cours: number;
    traite: number;
    refuse: number;
  };
}

export function EnhancedDashboardCharts({
  performanceBySubject,
  attendanceByMonth,
  gradeDistribution,
  admissionStats,
}: EnhancedDashboardChartsProps) {
  
  // Performance par matière - Bar Chart
  const performanceData = {
    labels: performanceBySubject.map(p => p.subject),
    datasets: [
      {
        label: 'Moyenne',
        data: performanceBySubject.map(p => p.average),
        backgroundColor: 'hsl(var(--primary) / 0.8)',
        borderColor: 'hsl(var(--primary))',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const performanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => `Moyenne: ${context.parsed.y.toFixed(2)}/20`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 20,
        grid: {
          color: 'hsl(var(--border) / 0.2)',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  // Distribution des notes - Doughnut Chart
  const distributionData = {
    labels: gradeDistribution.map(g => g.range),
    datasets: [
      {
        data: gradeDistribution.map(g => g.count),
        backgroundColor: [
          'hsl(var(--destructive) / 0.8)',
          'hsl(var(--warning) / 0.8)',
          'hsl(var(--primary) / 0.8)',
          'hsl(var(--success) / 0.8)',
        ],
        borderColor: [
          'hsl(var(--destructive))',
          'hsl(var(--warning))',
          'hsl(var(--primary))',
          'hsl(var(--success))',
        ],
        borderWidth: 2,
      },
    ],
  };

  const distributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'hsl(var(--foreground))',
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => `${context.label}: ${context.parsed} étudiants`,
        },
      },
    },
  };

  // Présence par mois - Line Chart
  const attendanceData = {
    labels: attendanceByMonth.map(a => a.month),
    datasets: [
      {
        label: 'Présents',
        data: attendanceByMonth.map(a => a.present),
        borderColor: 'hsl(var(--success))',
        backgroundColor: 'hsl(var(--success) / 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'hsl(var(--success))',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Absents',
        data: attendanceByMonth.map(a => a.absent),
        borderColor: 'hsl(var(--destructive))',
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'hsl(var(--destructive))',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const attendanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'hsl(var(--foreground))',
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(var(--border) / 0.2)',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
    },
  };

  // Stats d'admission - Doughnut
  const admissionData = {
    labels: ['Nouvelles', 'En cours', 'Traitées', 'Refusées'],
    datasets: [
      {
        data: [
          admissionStats.nouveau,
          admissionStats.en_cours,
          admissionStats.traite,
          admissionStats.refuse,
        ],
        backgroundColor: [
          'hsl(var(--primary) / 0.8)',
          'hsl(var(--warning) / 0.8)',
          'hsl(var(--success) / 0.8)',
          'hsl(var(--destructive) / 0.8)',
        ],
        borderColor: [
          'hsl(var(--primary))',
          'hsl(var(--warning))',
          'hsl(var(--success))',
          'hsl(var(--destructive))',
        ],
        borderWidth: 2,
      },
    ],
  };

  const totalAdmissions = Object.values(admissionStats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Row 1: Performance & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Performance par Matière
            </CardTitle>
            <CardDescription>Moyennes générales par matière</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {performanceBySubject.length > 0 ? (
                <Bar data={performanceData} options={performanceOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Distribution des Notes
            </CardTitle>
            <CardDescription>Répartition des moyennes des étudiants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {gradeDistribution.length > 0 ? (
                <Doughnut data={distributionData} options={distributionOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Attendance & Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Présence Mensuelle
            </CardTitle>
            <CardDescription>Évolution des présences et absences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {attendanceByMonth.length > 0 ? (
                <Line data={attendanceData} options={attendanceOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Admissions
            </CardTitle>
            <CardDescription>
              {totalAdmissions > 0 ? `${totalAdmissions} demande${totalAdmissions > 1 ? 's' : ''} au total` : 'Aucune demande'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {totalAdmissions > 0 ? (
                <Doughnut data={admissionData} options={distributionOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune demande d'admission
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
