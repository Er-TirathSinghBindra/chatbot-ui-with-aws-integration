import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction } from '../types';

// Initial state
const initialState: AppState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  loading: false,
  error: null,
  authState: {
    isAuthenticated: false,
    isLoading: true,
    error: null,
  },
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: [
            ...(state.messages[action.payload.conversationId] || []),
            action.payload.message,
          ],
        },
      };

    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages,
        },
      };

    case 'SET_CONVERSATIONS':
      return {
        ...state,
        conversations: action.payload,
      };

    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.conversationId === action.payload.conversationId
            ? { ...conv, ...action.payload.updates }
            : conv
        ),
      };

    case 'SET_ACTIVE_CONVERSATION':
      return {
        ...state,
        activeConversationId: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'SET_AUTH_STATE':
      return {
        ...state,
        authState: {
          ...state.authState,
          ...action.payload,
        },
      };

    case 'UPDATE_MESSAGE_STATUS':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: state.messages[action.payload.conversationId]?.map(
            (msg) =>
              msg.messageId === action.payload.messageId
                ? { ...msg, status: action.payload.status }
                : msg
          ) || [],
        },
      };

    case 'DELETE_CONVERSATION': {
      const conversationId = action.payload;
      const newMessages = { ...state.messages };
      delete newMessages[conversationId];

      return {
        ...state,
        conversations: state.conversations.filter((conv) => conv.conversationId !== conversationId),
        messages: newMessages,
        activeConversationId:
          state.activeConversationId === conversationId ? null : state.activeConversationId,
      };
    }

    default:
      return state;
  }
};

// Context type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
