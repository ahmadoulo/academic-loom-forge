export type AppRole = 'global_admin' | 'school_admin' | 'teacher' | 'student' | 'parent' | 'admission' | 'accountant' | 'secretary';

export interface AppUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  school_id: string | null;
  teacher_id: string | null;
  student_id: string | null;
  is_active: boolean;
}

export interface UserRole {
  role: AppRole;
  school_id: string | null;
}

export interface AuthSession {
  user: AppUser;
  roles: UserRole[];
  primaryRole: AppRole;
  primarySchoolId: string | null;
  primarySchoolIdentifier: string | null;
  sessionToken: string;
  sessionExpiresAt: string;
}

export interface AuthState {
  user: AppUser | null;
  roles: UserRole[];
  primaryRole: AppRole | null;
  primarySchoolId: string | null;
  primarySchoolIdentifier: string | null;
  loading: boolean;
  initialized: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: AppRole;
  schoolId?: string;
  teacherId?: string;
  studentId?: string;
  password?: string;
  sendInvitation?: boolean;
}
