import type { EnvironmentConfig } from '../types';

export const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    apiGatewayEndpoint: import.meta.env.VITE_API_GATEWAY_ENDPOINT || '',
    dynamoDBRegion: import.meta.env.VITE_DYNAMODB_REGION || 'us-east-1',
    chatHistoryTableName: import.meta.env.VITE_CHAT_HISTORY_TABLE || 'ChatHistory',
    conversationsTableName: import.meta.env.VITE_CONVERSATIONS_TABLE || 'Conversations',
    cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
    cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    cognitoRegion: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
  };
};

// Validate required environment variables
export const validateEnvironmentConfig = (): string[] => {
  const errors: string[] = [];
  const config = getEnvironmentConfig();

  if (!config.apiGatewayEndpoint) {
    errors.push('VITE_API_GATEWAY_ENDPOINT is required');
  }

  if (!config.cognitoUserPoolId) {
    errors.push('VITE_COGNITO_USER_POOL_ID is required');
  }

  if (!config.cognitoClientId) {
    errors.push('VITE_COGNITO_CLIENT_ID is required');
  }

  return errors;
};
