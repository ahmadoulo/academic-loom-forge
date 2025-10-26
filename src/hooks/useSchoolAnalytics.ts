import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AbsenceByClass {
  classId: string;
  className: string;
  totalAbsences: number;
  totalStudents: number;
  absenceRate: number;
}

interface TopStudent {
  id: string;
  firstname: string;
  lastname: string;
  className: string;
  average: number;
  totalGrades: number;
}

interface SubjectPerformance {
  subject: string;
  average: number;
  totalGrades: number;
  trend: 'up' | 'down' | 'stable';
}

interface GradeDistribution {
  grade: string;
  count: number;
  color: string;
}

export const useSchoolAnalytics = (schoolId?: string) => {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (!schoolId) return;

      try {
        setLoading(true);

        // Fetch attendance
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select(`
            *,
            students!inner(school_id, class_id),
            classes!inner(school_id)
          `)
          .eq('students.school_id', schoolId);

        // Fetch grades with relations (no filter needed here)
        const { data: gradesData } = await supabase
          .from('grades')
          .select(`
            *,
            students!inner(id, firstname, lastname),
            subjects(id, name),
            teachers(id, firstname, lastname)
          `);

        // Fetch students via student_school
        const { data: enrollments } = await supabase
          .from('student_school')
          .select(`
            student_id,
            class_id,
            students!inner(id, firstname, lastname),
            classes(id, name)
          `)
          .eq('school_id', schoolId)
          .eq('is_active', true);
        
        // Transform to match expected format
        const studentsData = enrollments?.map((e: any) => ({
          ...e.students,
          class_id: e.class_id,
          classes: e.classes
        }));

        // Fetch classes
        const { data: classesData } = await supabase
          .from('classes')
          .select('*')
          .eq('school_id', schoolId);

        // Fetch subjects
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('*')
          .eq('school_id', schoolId);

        setAttendance(attendanceData || []);
        setGrades(gradesData || []);
        setStudents(studentsData || []);
        setClasses(classesData || []);
        setSubjects(subjectsData || []);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId]);

  // Calculate absences by class
  const absencesByClass = useMemo((): AbsenceByClass[] => {
    if (!classes.length || !students.length) return [];

    return classes.map(classItem => {
      const classStudents = students.filter(s => s.class_id === classItem.id);
      const classAbsences = attendance.filter(
        a => a.class_id === classItem.id && a.status === 'absent'
      );

      return {
        classId: classItem.id,
        className: classItem.name,
        totalAbsences: classAbsences.length,
        totalStudents: classStudents.length,
        absenceRate: classStudents.length > 0 
          ? (classAbsences.length / (classStudents.length * 30)) * 100 // Approximation sur 30 jours
          : 0
      };
    }).sort((a, b) => b.totalAbsences - a.totalAbsences);
  }, [classes, students, attendance]);

  // Calculate top students by class
  const topStudentsByClass = useMemo((): TopStudent[] => {
    if (!grades.length || !students.length) return [];

    const studentAverages = students.map(student => {
      const studentGrades = grades.filter(g => g.student_id === student.id);
      const average = studentGrades.length > 0
        ? studentGrades.reduce((sum, g) => sum + Number(g.grade), 0) / studentGrades.length
        : 0;

      return {
        id: student.id,
        firstname: student.firstname,
        lastname: student.lastname,
        className: student.classes?.name || 'N/A',
        average: Number(average.toFixed(2)),
        totalGrades: studentGrades.length
      };
    });

    return studentAverages
      .filter(s => s.totalGrades > 0)
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);
  }, [grades, students]);

  // Calculate performance by subject
  const performanceBySubject = useMemo((): SubjectPerformance[] => {
    if (!grades.length || !subjects.length) return [];

    return subjects.map(subject => {
      const subjectGrades = grades.filter(g => g.subject_id === subject.id);
      const average = subjectGrades.length > 0
        ? subjectGrades.reduce((sum, g) => sum + Number(g.grade), 0) / subjectGrades.length
        : 0;

      // Simple trend calculation (could be improved with historical data)
      const trend: 'up' | 'down' | 'stable' = average >= 14 ? 'up' : average >= 12 ? 'stable' : 'down';

      return {
        subject: subject.name,
        average: Number(average.toFixed(2)),
        totalGrades: subjectGrades.length,
        trend
      };
    }).filter(s => s.totalGrades > 0);
  }, [grades, subjects]);

  // Calculate grade distribution
  const gradeDistribution = useMemo((): GradeDistribution[] => {
    if (!grades.length) return [];

    const distribution = [
      { grade: '16-20', count: 0, color: '#22c55e' },
      { grade: '14-16', count: 0, color: '#3b82f6' },
      { grade: '12-14', count: 0, color: '#f59e0b' },
      { grade: '10-12', count: 0, color: '#ef4444' },
      { grade: '0-10', count: 0, color: '#dc2626' }
    ];

    grades.forEach(grade => {
      const gradeValue = Number(grade.grade);
      if (gradeValue >= 16) distribution[0].count++;
      else if (gradeValue >= 14) distribution[1].count++;
      else if (gradeValue >= 12) distribution[2].count++;
      else if (gradeValue >= 10) distribution[3].count++;
      else distribution[4].count++;
    });

    return distribution;
  }, [grades]);

  // Calculate attendance rate by month
  const attendanceByMonth = useMemo(() => {
    if (!attendance.length) return [];

    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData: { [key: string]: { present: number; total: number } } = {};

    attendance.forEach(record => {
      const date = new Date(record.date);
      const monthKey = months[date.getMonth()];
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { present: 0, total: 0 };
      }
      
      monthlyData[monthKey].total++;
      if (record.status === 'present') {
        monthlyData[monthKey].present++;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
    }));
  }, [attendance]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalGrades = grades.length;
    const averageGrade = totalGrades > 0
      ? grades.reduce((sum, g) => sum + Number(g.grade), 0) / totalGrades
      : 0;

    const passingGrades = grades.filter(g => Number(g.grade) >= 10).length;
    const successRate = totalGrades > 0 ? (passingGrades / totalGrades) * 100 : 0;

    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    const studentsInDifficulty = topStudentsByClass.filter(s => s.average < 10).length;

    return {
      averageGrade: Number(averageGrade.toFixed(1)),
      successRate: Math.round(successRate),
      attendanceRate: Math.round(attendanceRate),
      studentsInDifficulty
    };
  }, [grades, attendance, topStudentsByClass]);

  return {
    loading,
    absencesByClass,
    topStudentsByClass,
    performanceBySubject,
    gradeDistribution,
    attendanceByMonth,
    overallStats
  };
};
