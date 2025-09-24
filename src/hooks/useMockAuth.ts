import { useState } from 'react';

// Hook d'authentification factice pour accès complet
export const useMockAuth = () => {
  const [user] = useState({
    id: 'mock-admin-id',
    email: 'admin@eduvate.com',
    first_name: 'Super',
    last_name: 'Admin',
    role: 'global_admin',
    school_id: null,
    is_active: true,
    last_login: new Date().toISOString(),
    teacher_id: null,
  });

  const logout = () => {
    window.location.href = '/admin';
  };

  return {
    user,
    loading: false,
    logout,
    checkAuthStatus: () => {},
    loginWithCredentials: () => Promise.resolve(user),
  };
};