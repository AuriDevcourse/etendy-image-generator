import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../lib/supabase';

export default function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    // Show loading spinner while checking auth
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2a1f1a, #000000)' }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login (Google OAuth)
    authService.signInWithGoogle();
    return null;
  }

  return children;
}
