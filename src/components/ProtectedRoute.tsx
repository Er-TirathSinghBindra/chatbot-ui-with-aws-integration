import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { checkFederatedAuth } from '../services/authService';
import { useAppContext } from '../context/AppContext';
import { LoginPage } from './LoginPage';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { dispatch } = useAppContext();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Development mode bypass - skip login page entirely
  const BYPASS_LOGIN_PAGE = import.meta.env.VITE_BYPASS_LOGIN_PAGE === 'true';
  const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

  useEffect(() => {
    const checkAuth = async () => {
      // Bypass login page completely in development mode
      if (BYPASS_LOGIN_PAGE) {
        console.log('🔓 Development mode: Login page bypassed');
        setIsAuthenticated(true);
        dispatch({
          type: 'SET_AUTH_STATE',
          payload: {
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
        });
        setIsChecking(false);
        return;
      }

      // Check for dev mode login session
      if (BYPASS_AUTH) {
        const devSession = localStorage.getItem('dev_auth_session');
        if (devSession === 'authenticated') {
          console.log('🔓 Development mode: Session found');
          setIsAuthenticated(true);
          dispatch({
            type: 'SET_AUTH_STATE',
            payload: {
              isAuthenticated: true,
              isLoading: false,
              error: null,
            },
          });
          setIsChecking(false);
          return;
        }
      }

      try {
        const authenticated = await checkFederatedAuth();
        setIsAuthenticated(authenticated);

        dispatch({
          type: 'SET_AUTH_STATE',
          payload: {
            isAuthenticated: authenticated,
            isLoading: false,
            error: null,
          },
        });

        if (!authenticated) {
          console.log('User not authenticated - showing login page');
        }
      } catch (error) {
        dispatch({
          type: 'SET_AUTH_STATE',
          payload: {
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication check failed',
          },
        });
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [dispatch, BYPASS_LOGIN_PAGE, BYPASS_AUTH]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => window.location.reload()} />;
  }

  return <>{children}</>;
};
