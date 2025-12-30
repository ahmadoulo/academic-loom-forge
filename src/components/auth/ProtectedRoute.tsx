import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { SchoolBlockedAccess } from '@/components/school/SchoolBlockedAccess';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/auth' 
}: ProtectedRouteProps) {
  const { user, loading } = useCustomAuth();
  const [schoolStatus, setSchoolStatus] = useState<{
    isActive: boolean;
    hasSubscription: boolean;
    subscriptionExpired: boolean;
    schoolName: string;
  } | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkSchoolAccess = async () => {
      if (!user || !user.school_id || user.role === 'global_admin' || user.role === 'admin') {
        setCheckingAccess(false);
        return;
      }

      try {
        // Check school status
        const { data: school } = await supabase
          .from('schools')
          .select('is_active, name')
          .eq('id', user.school_id)
          .single();

        if (!school) {
          setSchoolStatus({ 
            isActive: false, 
            hasSubscription: false, 
            subscriptionExpired: false,
            schoolName: 'École'
          });
          setCheckingAccess(false);
          return;
        }

        // Check subscription status
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('school_id', user.school_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const hasActiveSubscription = subscription && 
          (subscription.status === 'active' || subscription.status === 'trial');
        
        const isExpired = subscription && 
          new Date(subscription.end_date) < new Date() &&
          subscription.status !== 'active';

        setSchoolStatus({
          isActive: school.is_active,
          hasSubscription: !!subscription && hasActiveSubscription,
          subscriptionExpired: isExpired || false,
          schoolName: school.name
        });
      } catch (error) {
        console.error('Error checking school access:', error);
        setSchoolStatus({ 
          isActive: false, 
          hasSubscription: false, 
          subscriptionExpired: false,
          schoolName: 'École'
        });
      } finally {
        setCheckingAccess(false);
      }
    };

    if (!loading) {
      checkSchoolAccess();
    }
  }, [user, loading]);

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Vérification de l'authentification...</span>
        </div>
      </div>
    );
  }

  // Check school access for non-admin users
  if (user && user.school_id && user.role !== 'global_admin' && user.role !== 'admin' && schoolStatus) {
    if (!schoolStatus.isActive) {
      return <SchoolBlockedAccess type="deactivated" schoolName={schoolStatus.schoolName} />;
    }

    if (!schoolStatus.hasSubscription || schoolStatus.subscriptionExpired) {
      return <SchoolBlockedAccess 
        type={schoolStatus.subscriptionExpired ? 'expired' : 'no-subscription'} 
        schoolName={schoolStatus.schoolName} 
      />;
    }
  }

  if (!user || !user.is_active) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Rediriger vers la page appropriée selon le rôle
    if (user.role === 'global_admin' || user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'school_admin') {
      // Use school identifier from localStorage or fetch it
      const schoolIdentifier = localStorage.getItem('app_school_identifier');
      if (schoolIdentifier) {
        return <Navigate to={`/school/${schoolIdentifier}`} replace />;
      }
      return <Navigate to="/auth" replace />;
    } else if (user.role === 'teacher' && user.teacher_id) {
      return <Navigate to={`/teacher/${user.teacher_id}`} replace />;
    } else {
      return <Navigate to="/auth" replace />;
    }
  }

  return <>{children}</>;
}