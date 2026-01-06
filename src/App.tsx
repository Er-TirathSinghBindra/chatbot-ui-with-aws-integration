import React, { useEffect, useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ConversationList } from './components/ConversationList';
import { ConversationView } from './components/ConversationView';
import { configureAuth } from './services/authService';
// DynamoDB will be configured after authentication in components that need it
import { configure as configureAPIGateway } from './services/apiGatewayService';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center max-w-md p-8">
            <div className="text-red-600 mb-4">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get environment configuration
        const config = {
          cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
          cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
          cognitoRegion: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
          apiGatewayEndpoint: import.meta.env.VITE_API_GATEWAY_ENDPOINT || '',
          dynamoDBRegion: import.meta.env.VITE_DYNAMODB_REGION || 'us-east-1',
          chatHistoryTable: import.meta.env.VITE_CHAT_HISTORY_TABLE || 'ChatHistory',
          conversationsTable: import.meta.env.VITE_CONVERSATIONS_TABLE || 'Conversations',
        };

        // Configure AWS Amplify for Cognito
        if (config.cognitoUserPoolId && config.cognitoClientId) {
          configureAuth({
            userPoolId: config.cognitoUserPoolId,
            userPoolClientId: config.cognitoClientId,
            region: config.cognitoRegion,
          });
        }

        // Configure API Gateway
        if (config.apiGatewayEndpoint) {
          configureAPIGateway(config.apiGatewayEndpoint);
        }

        // Note: DynamoDB will be configured after authentication
        // because it needs Cognito credentials

        setInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize application');
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="text-red-600 mb-4">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Initialization Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <ConversationList />
        <ConversationView />
      </div>
    </ProtectedRoute>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
