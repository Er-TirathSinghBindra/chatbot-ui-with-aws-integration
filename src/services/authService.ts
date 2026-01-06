import { Amplify } from 'aws-amplify';
import { fetchAuthSession, signOut as amplifySignOut, getCurrentUser } from 'aws-amplify/auth';
import type { AuthError } from '../types';

// Configure AWS Amplify with Cognito settings
export const configureAuth = (config: {
  userPoolId: string;
  userPoolClientId: string;
  region: string;
}) => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        loginWith: {
          oauth: {
            domain: '', // Will be set when OAuth is configured
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: [window.location.origin],
            redirectSignOut: [window.location.origin],
            responseType: 'code',
          },
        },
      },
    },
  });
};

// Check if user is authenticated
export const checkFederatedAuth = async (): Promise<boolean> => {
  try {
    await getCurrentUser();
    return true;
  } catch (error) {
    return false;
  }
};

// Get Cognito session token
export const getFederatedToken = async (): Promise<string> => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return token;
  } catch (error) {
    const authError: AuthError = {
      code: 'TOKEN_RETRIEVAL_FAILED',
      message: error instanceof Error ? error.message : 'Failed to retrieve authentication token',
      name: 'AuthTokenError',
    };
    throw authError;
  }
};

// Refresh expired token
export const refreshToken = async (): Promise<string> => {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    const token = session.tokens?.idToken?.toString();
    
    if (!token) {
      throw new Error('Failed to refresh authentication token');
    }
    
    return token;
  } catch (error) {
    const authError: AuthError = {
      code: 'TOKEN_REFRESH_FAILED',
      message: error instanceof Error ? error.message : 'Failed to refresh authentication token',
      name: 'AuthTokenError',
    };
    throw authError;
  }
};

// Sign out user
export const signOut = async (): Promise<void> => {
  try {
    await amplifySignOut();
  } catch (error) {
    const authError: AuthError = {
      code: 'SIGNOUT_FAILED',
      message: error instanceof Error ? error.message : 'Failed to sign out',
      name: 'AuthSignOutError',
    };
    throw authError;
  }
};

// Get current authenticated user info
export const getCurrentUserInfo = async () => {
  try {
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    const authError: AuthError = {
      code: 'USER_INFO_FAILED',
      message: error instanceof Error ? error.message : 'Failed to get user information',
      name: 'AuthUserInfoError',
    };
    throw authError;
  }
};
