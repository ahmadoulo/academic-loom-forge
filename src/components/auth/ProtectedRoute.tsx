import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Loader2 } from 'lucide-react';

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
  const { user, loading, checkAuthStatus } = useCustomAuth();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Vérification de l'authentification...</span>
        </div>
      </div>
    );
  }

  if (!user || !user.is_active) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Rediriger vers la page appropriée selon le rôle
    if (user.role === 'global_admin' || user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'school_admin') {
      return <Navigate to={`/school/${user.school_id}`} replace />;
    } else if (user.role === 'teacher' && user.teacher_id) {
      return <Navigate to={`/teacher/${user.teacher_id}`} replace />;
    } else {
      return <Navigate to="/auth" replace />;
    }
  }

  return <>{children}</>;
}