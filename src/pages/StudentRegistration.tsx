import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redirect old student registration page to new account activation page
export default function StudentRegistration() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/activate-account', { replace: true });
  }, [navigate]);

  return null;
}