import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Smart redirect page:
 * - Guest users → /questionnaire (start diagnosis from scratch)
 * - Authenticated users → /dashboard (see their pets, diagnose or add new)
 */
const PetSelectorPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/questionnaire');
    } else {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return null;
};

export default PetSelectorPage;
