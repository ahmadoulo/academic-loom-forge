import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAcademicYear } from './useAcademicYear';

export interface ClassSessionHours {
  classId: string;
  className: string;
  totalHours: number;
  sessionCount: number;
}

export interface TeacherSessionHoursData {
  totalHours: number;
  totalSessions: number;
  hoursByClass: ClassSessionHours[];
}

export const useTeacherSessionHours = (teacherId: string | undefined) => {
  const [data, setData] = useState<TeacherSessionHoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentYear } = useAcademicYear();

  useEffect(() => {
    const fetchSessionHours = async () => {
      if (!teacherId || !currentYear?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all course sessions for this teacher in the current academic year
        const { data: sessions, error: sessionsError } = await supabase
          .from('assignments')
          .select(`
            id,
            class_id,
            start_time,
            end_time,
            session_date,
            classes:class_id (
              id,
              name
            )
          `)
          .eq('teacher_id', teacherId)
          .eq('school_year_id', currentYear.id)
          .eq('type', 'course')
          .not('start_time', 'is', null)
          .not('end_time', 'is', null);

        if (sessionsError) throw sessionsError;

        if (!sessions || sessions.length === 0) {
          setData({
            totalHours: 0,
            totalSessions: 0,
            hoursByClass: []
          });
          setLoading(false);
          return;
        }

        // Calculate hours by class
        const classHoursMap = new Map<string, { className: string; totalMinutes: number; sessionCount: number }>();

        sessions.forEach((session) => {
          if (session.start_time && session.end_time && session.class_id) {
            const startParts = session.start_time.split(':');
            const endParts = session.end_time.split(':');
            
            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
            
            const durationMinutes = endMinutes - startMinutes;
            
            if (durationMinutes > 0) {
              const existing = classHoursMap.get(session.class_id);
              const classData = session.classes as { id: string; name: string } | null;
              const className = classData?.name || 'Classe inconnue';
              
              if (existing) {
                existing.totalMinutes += durationMinutes;
                existing.sessionCount += 1;
              } else {
                classHoursMap.set(session.class_id, {
                  className,
                  totalMinutes: durationMinutes,
                  sessionCount: 1
                });
              }
            }
          }
        });

        // Convert to array and calculate hours
        const hoursByClass: ClassSessionHours[] = [];
        let totalMinutes = 0;
        let totalSessions = 0;

        classHoursMap.forEach((value, classId) => {
          const hours = Math.round((value.totalMinutes / 60) * 100) / 100;
          hoursByClass.push({
            classId,
            className: value.className,
            totalHours: hours,
            sessionCount: value.sessionCount
          });
          totalMinutes += value.totalMinutes;
          totalSessions += value.sessionCount;
        });

        // Sort by hours descending
        hoursByClass.sort((a, b) => b.totalHours - a.totalHours);

        setData({
          totalHours: Math.round((totalMinutes / 60) * 100) / 100,
          totalSessions,
          hoursByClass
        });
      } catch (err) {
        console.error('Error fetching teacher session hours:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du calcul des heures');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionHours();
  }, [teacherId, currentYear?.id]);

  return { data, loading, error };
};
