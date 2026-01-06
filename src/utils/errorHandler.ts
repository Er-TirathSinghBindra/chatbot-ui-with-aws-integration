import type { AuthError } from '../types';

// DynamoDB Error Handling
export const parseDynamoDBError = (error: any): string => {
  if (!error) return 'Unknown DynamoDB error';

  // Handle AWS SDK errors
  if (error.name) {
    switch (error.name) {
      case 'ResourceNotFoundException':
        return 'Database table not found. Please check your configuration.';
      case 'AccessDeniedException':
        return 'Access denied. Please check your authentication credentials.';
      case 'ProvisionedThroughputExceededException':
        return 'Database is busy. Please try again in a moment.';
      case 'ThrottlingException':
        return 'Too many requests. Please wait a moment and try again.';
      case 'ValidationException':
        return 'Invalid data format. Please check your input.';
      case 'ConditionalCheckFailedException':
        return 'Data conflict detected. Please refresh and try again.';
      case 'ItemCollectionSizeLimitExceededException':
        return 'Storage limit exceeded for this conversation.';
      case 'RequestLimitExceeded':
        return 'Request limit exceeded. Please try again later.';
      case 'InternalServerError':
        return 'Database service error. Please try again later.';
      case 'ServiceUnavailable':
        return 'Database service is temporarily unavailable.';
      default:
        return `Database error: ${error.message || error.name}`;
    }
  }

  // Handle network errors
  if (error.message?.includes('Network')) {
    return 'Network error. Please check your internet connection.';
  }

  return error.message || 'An unexpected database error occurred';
};

// API Gateway Error Handling
export const parseAPIGatewayError = (error: any): string => {
  if (!error) return 'Unknown API error';

  // Handle timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
    return 'Request timed out. The server took too long to respond.';
  }

  // Handle abort errors
  if (error.name === 'AbortError' || error.message?.includes('abort')) {
    return 'Request was cancelled. Please try again.';
  }

  // Handle network errors
  if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
    return 'Network error. Please check your internet connection.';
  }

  // Handle HTTP status errors
  if (error.message?.includes('Client error')) {
    const statusMatch = error.message.match(/\((\d+)\)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      switch (status) {
        case 400:
          return 'Invalid request. Please check your message and try again.';
        case 401:
          return 'Authentication failed. Please sign in again.';
        case 403:
          return 'Access forbidden. You do not have permission to perform this action.';
        case 404:
          return 'API endpoint not found. Please check your configuration.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        default:
          return `Request failed with status ${status}`;
      }
    }
  }

  if (error.message?.includes('Server error')) {
    const statusMatch = error.message.match(/\((\d+)\)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      switch (status) {
        case 500:
          return 'Server error. Please try again later.';
        case 502:
          return 'Bad gateway. The server is temporarily unavailable.';
        case 503:
          return 'Service unavailable. Please try again later.';
        case 504:
          return 'Gateway timeout. The server took too long to respond.';
        default:
          return `Server error with status ${status}`;
      }
    }
  }

  return error.message || 'An unexpected API error occurred';
};

// Cognito Authentication Error Handling
export const parseAuthError = (error: any): string => {
  if (!error) return 'Unknown authentication error';

  // Handle AuthError type
  const authError = error as AuthError;
  if (authError.code) {
    switch (authError.code) {
      case 'UserNotFoundException':
        return 'User not found. Please check your credentials.';
      case 'NotAuthorizedException':
        return 'Incorrect username or password.';
      case 'UserNotConfirmedException':
        return 'User account not confirmed. Please check your email.';
      case 'PasswordResetRequiredException':
        return 'Password reset required. Please reset your password.';
      case 'InvalidParameterException':
        return 'Invalid authentication parameters.';
      case 'InvalidPasswordException':
        return 'Password does not meet requirements.';
      case 'UsernameExistsException':
        return 'Username already exists.';
      case 'TooManyRequestsException':
        return 'Too many authentication attempts. Please try again later.';
      case 'TooManyFailedAttemptsException':
        return 'Too many failed attempts. Please try again later.';
      case 'ExpiredCodeException':
        return 'Verification code expired. Please request a new one.';
      case 'CodeMismatchException':
        return 'Invalid verification code.';
      case 'NetworkError':
        return 'Network error. Please check your internet connection.';
      case 'TOKEN_RETRIEVAL_FAILED':
        return 'Failed to retrieve authentication token. Please sign in again.';
      case 'TOKEN_REFRESH_FAILED':
        return 'Failed to refresh authentication token. Please sign in again.';
      case 'SIGNOUT_FAILED':
        return 'Failed to sign out. Please try again.';
      case 'USER_INFO_FAILED':
        return 'Failed to retrieve user information.';
      default:
        return authError.message || `Authentication error: ${authError.code}`;
    }
  }

  // Handle generic errors
  if (error.message?.includes('Network')) {
    return 'Network error. Please check your internet connection.';
  }

  return error.message || 'An unexpected authentication error occurred';
};

// Generic error formatter
export const formatError = (error: any, context?: string): string => {
  const prefix = context ? `${context}: ` : '';

  if (typeof error === 'string') {
    return prefix + error;
  }

  if (error instanceof Error) {
    return prefix + error.message;
  }

  if (error?.message) {
    return prefix + error.message;
  }

  return prefix + 'An unexpected error occurred';
};

// User-friendly error messages for common scenarios
export const getErrorMessage = (errorType: string, error?: any): string => {
  const commonMessages: Record<string, string> = {
    LOAD_CONVERSATIONS_FAILED: 'Failed to load conversations. Please refresh the page.',
    LOAD_MESSAGES_FAILED: 'Failed to load messages. Please try selecting the conversation again.',
    SEND_MESSAGE_FAILED: 'Failed to send message. Please try again.',
    CREATE_CONVERSATION_FAILED: 'Failed to create conversation. Please try again.',
    UPDATE_CONVERSATION_FAILED: 'Failed to update conversation.',
    SAVE_MESSAGE_FAILED: 'Failed to save message to database.',
    AUTH_CHECK_FAILED: 'Failed to verify authentication. Please sign in again.',
    INIT_FAILED: 'Failed to initialize application. Please refresh the page.',
  };

  const baseMessage = commonMessages[errorType] || 'An error occurred';

  if (error) {
    const details = formatError(error);
    return `${baseMessage} (${details})`;
  }

  return baseMessage;
};

// Retry helper with exponential backoff
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on certain errors
      if (
        lastError.message.includes('401') ||
        lastError.message.includes('403') ||
        lastError.message.includes('404')
      ) {
        throw lastError;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
};
