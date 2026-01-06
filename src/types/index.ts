// Message Model
export interface Message {
  messageId: string; // user_message_id or system_message_id
  conversationId: string; // conversation_id
  messageType: 'user' | 'system';
  content: string;
  timestamp: number; // Unix timestamp
  status?: 'sending' | 'sent' | 'error';
}

// Conversation Model
export interface Conversation {
  conversationId: string;
  title: string;
  createdAt: number; // Unix timestamp
  lastMessageAt: number; // Unix timestamp
  messageCount: number;
}

// Application State
export interface AppState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // Keyed by conversationId
  loading: boolean;
  error: string | null;
  authState: AuthState;
}

// Authentication State
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Environment Configuration
export interface EnvironmentConfig {
  // API Gateway
  apiGatewayEndpoint: string;

  // DynamoDB
  dynamoDBRegion: string;
  chatHistoryTableName: string;
  conversationsTableName: string;

  // AWS Cognito (Federated Auth)
  cognitoUserPoolId: string;
  cognitoClientId: string;
  cognitoRegion: string;
}

// Action Types for State Management
export type AppAction =
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_AUTH_STATE'; payload: Partial<AuthState> }
  | { type: 'SET_MESSAGES'; payload: { conversationId: string; messages: Message[] } }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { conversationId: string; messageId: string; status: Message['status'] } }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: { conversationId: string; updates: Partial<Conversation> } }
  | { type: 'DELETE_CONVERSATION'; payload: string };

// Authentication Error Types
export interface AuthError {
  code: string;
  message: string;
  name: string;
}

// API Gateway Response
export interface APIGatewayResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

// DynamoDB Item Types
export interface DynamoDBMessageItem {
  conversationId: string;
  timestamp: number;
  messageId: string;
  messageType: 'user' | 'system';
  content: string;
  status?: string;
}

export interface DynamoDBConversationItem {
  conversationId: string;
  title: string;
  createdAt: number;
  lastMessageAt: number;
  messageCount: number;
}
