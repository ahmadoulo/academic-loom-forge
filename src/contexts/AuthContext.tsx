import { createContext, useContext, ReactNode } from 'react';
import { useAppAuth } from '@/hooks/useAppAuth';
import type { AppUser, UserRole, AppRole, CreateUserData } from '@/types/auth';

interface AuthContextValue {
  user: AppUser | null;
  roles: UserRole[];
  primaryRole: AppRole | null;
  primarySchoolId: string | null;
  primarySchoolIdentifier: string | null;
  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  createUser: (userData: CreateUserData, createdBy: string) => Promise<any>;
  resetPassword: (userId: string, requestedBy: string) => Promise<any>;
  setPassword: (token: string, password: string) => Promise<any>;
  hasRole: (role: AppRole, schoolId?: string) => boolean;
  getRedirectPath: () => string;
  validateSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAppAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
