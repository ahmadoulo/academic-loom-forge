import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SchoolBlockedAccess } from '@/components/school/SchoolBlockedAccess';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AppRole[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  fallbackPath = '/auth',
}: ProtectedRouteProps) {
  const { user, primaryRole, loading, initialized, getRedirectPath } = useAuth();
  const [schoolStatus, setSchoolStatus] = useState<{
    isActive: boolean;
    hasSubscription: boolean;
    subscriptionExpired: boolean;
    schoolName: string;
  } | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const isAdminLike = primaryRole === 'global_admin';
  const isAuthed = !!user;

  const isAllowedByRole = useMemo(() => {
    if (requiredRoles.length === 0) return true;
    if (!primaryRole) return false;
    return requiredRoles.includes(primaryRole);
  }, [primaryRole, requiredRoles]);

  useEffect(() => {
    const checkSchoolAccess = async () => {
      // Not authenticated / no school: nothing to check here.
      if (!user?.school_id || isAdminLike) {
        setCheckingAccess(false);
        return;
      }

      try {
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
            schoolName: 'École',
          });
          return;
        }

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('school_id', user.school_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const hasActiveSubscription =
          !!subscription && (subscription.status === 'active' || subscription.status === 'trial');

        const isExpired =
          !!subscription &&
          new Date(subscription.end_date) < new Date() &&
          subscription.status !== 'active';

        setSchoolStatus({
          isActive: school.is_active,
          hasSubscription: hasActiveSubscription,
          subscriptionExpired: isExpired || false,
          schoolName: school.name,
        });
      } catch (error) {
        console.error('Error checking school access:', error);
        setSchoolStatus({
          isActive: false,
          hasSubscription: false,
          subscriptionExpired: false,
          schoolName: 'École',
        });
      } finally {
        setCheckingAccess(false);
      }
    };

    if (initialized && !loading) {
      checkSchoolAccess();
    }
  }, [initialized, loading, user?.school_id, isAdminLike]);

  if (!initialized || loading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Vérification de l'authentification...</span>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check school access for non-admin users
  if (!isAdminLike && user?.school_id && schoolStatus) {
    if (!schoolStatus.isActive) {
      return <SchoolBlockedAccess type="deactivated" schoolName={schoolStatus.schoolName} />;
    }

    if (!schoolStatus.hasSubscription || schoolStatus.subscriptionExpired) {
      return (
        <SchoolBlockedAccess
          type={schoolStatus.subscriptionExpired ? 'expired' : 'no-subscription'}
          schoolName={schoolStatus.schoolName}
        />
      );
    }
  }

  if (!isAllowedByRole) {
    return <Navigate to={getRedirectPath()} replace />;
  }

  return <>{children}</>;
}
