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
  subjectId: string;
  average: number;
  totalGrades: number;
  trend: 'up' | 'down' | 'stable';
  teacherName: string;
  byClass: Array<{
    classId: string;
    className: string;
    average: number;
    totalGrades: number;
    teacherName: string;
  }>;
}

interface GradeDistribution {
  grade: string;
  count: number;
  color: string;
}

interface TopStudentByClass {
  classId: string;
  className: string;
  students: Array<{
    id: string;
    firstname: string;
    lastname: string;
    average: number;
    totalGrades: number;
  }>;
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

        // Fetch classes first for the school
        const { data: classesData } = await supabase
          .from('classes')
          .select('*')
          .eq('school_id', schoolId)
          .eq('archived', false);

        const classIds = classesData?.map(c => c.id) || [];

        // Fetch attendance filtered by classes of the school
        let attendanceData: any[] = [];
        if (classIds.length > 0) {
          const { data } = await supabase
            .from('attendance')
            .select('*')
            .in('class_id', classIds);
          attendanceData = data || [];
        }

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
        })) || [];

        const studentIds = studentsData.map((s: any) => s.id);

        // Fetch grades filtered by students of the school
        let gradesData: any[] = [];
        if (studentIds.length > 0) {
          const { data } = await supabase
            .from('grades')
            .select(`
              *,
              students!inner(id, firstname, lastname),
              subjects(id, name),
              teachers(id, firstname, lastname)
            `)
            .in('student_id', studentIds);
          gradesData = data || [];
        }

        // Fetch subjects
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('*')
          .eq('school_id', schoolId);

        setAttendance(attendanceData);
        setGrades(gradesData);
        setStudents(studentsData);
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

  // Calculate top students grouped by class
  const topStudentsByClass = useMemo((): TopStudentByClass[] => {
    if (!grades.length || !students.length || !classes.length) return [];

    return classes.map(classItem => {
      const classStudents = students.filter(s => s.class_id === classItem.id);
      
      const studentAverages = classStudents.map(student => {
        const studentGrades = grades.filter(g => g.student_id === student.id);
        const average = studentGrades.length > 0
          ? studentGrades.reduce((sum, g) => sum + Number(g.grade), 0) / studentGrades.length
          : 0;

        return {
          id: student.id,
          firstname: student.firstname,
          lastname: student.lastname,
          average: Number(average.toFixed(2)),
          totalGrades: studentGrades.length
        };
      });

      return {
        classId: classItem.id,
        className: classItem.name,
        students: studentAverages
          .filter(s => s.totalGrades > 0)
          .sort((a, b) => b.average - a.average)
          .slice(0, 3) // Top 3 par classe
      };
    }).filter(c => c.students.length > 0);
  }, [grades, students, classes]);

  // Calculate performance by subject with class breakdown
  const performanceBySubject = useMemo((): SubjectPerformance[] => {
    if (!grades.length || !subjects.length) return [];

    return subjects.map(subject => {
      const subjectGrades = grades.filter(g => g.subject_id === subject.id);
      const average = subjectGrades.length > 0
        ? subjectGrades.reduce((sum, g) => sum + Number(g.grade), 0) / subjectGrades.length
        : 0;

      // Get teacher name from subject or grades
      const teacherFromGrades = subjectGrades[0]?.teachers;
      const teacherName = teacherFromGrades 
        ? `${teacherFromGrades.firstname || ''} ${teacherFromGrades.lastname || ''}`.trim() 
        : 'Non assigné';

      // Calculate performance by class
      const byClass = classes.map(classItem => {
        const classStudentIds = students.filter(s => s.class_id === classItem.id).map(s => s.id);
        const classSubjectGrades = subjectGrades.filter(g => classStudentIds.includes(g.student_id));
        const classAverage = classSubjectGrades.length > 0
          ? classSubjectGrades.reduce((sum, g) => sum + Number(g.grade), 0) / classSubjectGrades.length
          : 0;

        // Get teacher for this specific class if different
        const classTeacher = classSubjectGrades[0]?.teachers;
        const classTeacherName = classTeacher 
          ? `${classTeacher.firstname || ''} ${classTeacher.lastname || ''}`.trim() 
          : teacherName;

        return {
          classId: classItem.id,
          className: classItem.name,
          average: Number(classAverage.toFixed(2)),
          totalGrades: classSubjectGrades.length,
          teacherName: classTeacherName
        };
      }).filter(c => c.totalGrades > 0);

      // Simple trend calculation
      const trend: 'up' | 'down' | 'stable' = average >= 14 ? 'up' : average >= 12 ? 'stable' : 'down';

      return {
        subject: subject.name,
        subjectId: subject.id,
        average: Number(average.toFixed(2)),
        totalGrades: subjectGrades.length,
        trend,
        teacherName,
        byClass
      };
    }).filter(s => s.totalGrades > 0);
  }, [grades, subjects, classes, students]);

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

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData: { [key: number]: { present: number; total: number } } = {};

    attendance.forEach(record => {
      const date = new Date(record.date);
      const monthIndex = date.getMonth();
      
      if (!monthlyData[monthIndex]) {
        monthlyData[monthIndex] = { present: 0, total: 0 };
      }
      
      monthlyData[monthIndex].total++;
      if (record.status === 'present') {
        monthlyData[monthIndex].present++;
      }
    });

    // Convert to array sorted by month index
    return Object.entries(monthlyData)
      .map(([monthIndex, data]) => ({
        month: monthNames[parseInt(monthIndex)],
        monthIndex: parseInt(monthIndex),
        rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
      }))
      .sort((a, b) => a.monthIndex - b.monthIndex)
      .map(({ month, rate }) => ({ month, rate }));
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

    // Count students in difficulty from all classes
    const allStudentAverages = students.map(student => {
      const studentGrades = grades.filter(g => g.student_id === student.id);
      if (studentGrades.length === 0) return null;
      return studentGrades.reduce((sum, g) => sum + Number(g.grade), 0) / studentGrades.length;
    }).filter((avg): avg is number => avg !== null);
    
    const studentsInDifficulty = allStudentAverages.filter(avg => avg < 10).length;

    return {
      averageGrade: Number(averageGrade.toFixed(1)),
      successRate: Math.round(successRate),
      attendanceRate: Math.round(attendanceRate),
      studentsInDifficulty
    };
  }, [grades, attendance, students]);

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
