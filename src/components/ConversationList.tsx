import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { listConversations, createConversation, deleteConversation } from '../services/dynamoDBService';
import { generateConversationId } from '../services/idService';
import { signOut } from '../services/authService';
import type { Conversation } from '../types';

export const ConversationList: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { conversations, activeConversationId } = state;

  // Development mode bypass
  const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const USE_LOCAL_STORAGE = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use mock data in development mode
        if (USE_MOCK_DATA) {
          console.log('🔧 Development mode: Using mock conversations');
          const mockConversations: Conversation[] = [
            {
              conversationId: 'conv_mock_1',
              title: 'Sample Conversation 1',
              createdAt: Date.now() - 86400000,
              lastMessageAt: Date.now() - 3600000,
              messageCount: 5,
            },
            {
              conversationId: 'conv_mock_2',
              title: 'Sample Conversation 2',
              createdAt: Date.now() - 172800000,
              lastMessageAt: Date.now() - 7200000,
              messageCount: 3,
            },
          ];
          dispatch({ type: 'SET_CONVERSATIONS', payload: mockConversations });
          setLoading(false);
          return;
        }

        // Use local storage in dev mode
        if (USE_LOCAL_STORAGE) {
          console.log('🔧 Development mode: Using local storage for conversations');
          const storedConversations = localStorage.getItem('conversations');
          const convs = storedConversations ? JSON.parse(storedConversations) : [];
          dispatch({ type: 'SET_CONVERSATIONS', payload: convs });
          setLoading(false);
          return;
        }

        const convs = await listConversations();
        dispatch({ type: 'SET_CONVERSATIONS', payload: convs });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [dispatch, USE_MOCK_DATA, USE_LOCAL_STORAGE]);

  const handleNewConversation = async () => {
    try {
      const conversationId = generateConversationId();
      const now = Date.now();

      const newConversation: Conversation = {
        conversationId,
        title: 'New Conversation',
        createdAt: now,
        lastMessageAt: now,
        messageCount: 0,
      };

      // Skip DynamoDB in mock mode or local storage mode
      if (USE_MOCK_DATA) {
        console.log('🔧 Development mode: Skipping DynamoDB conversation creation');
      } else if (USE_LOCAL_STORAGE) {
        console.log('🔧 Development mode: Saving conversation to local storage');
        const updatedConversations = [newConversation, ...conversations];
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
      } else {
        await createConversation(conversationId);
      }

      // Add to state
      dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });

      // Set as active
      dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversationId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversationId });
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the conversation

    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      // Skip DynamoDB in mock mode or local storage mode
      if (USE_MOCK_DATA) {
        console.log('🔧 Development mode: Skipping DynamoDB conversation deletion');
      } else if (USE_LOCAL_STORAGE) {
        console.log('🔧 Development mode: Deleting conversation from local storage');
        const updatedConversations = conversations.filter(c => c.conversationId !== conversationId);
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        localStorage.removeItem(`messages_${conversationId}`);
      } else {
        await deleteConversation(conversationId);
      }

      // Remove from state
      dispatch({ type: 'DELETE_CONVERSATION', payload: conversationId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  };

  const handleSignOut = async () => {
    if (!confirm('Are you sure you want to sign out?')) {
      return;
    }

    try {
      // Clear dev session if in dev mode
      if (USE_MOCK_DATA || USE_LOCAL_STORAGE) {
        localStorage.removeItem('dev_auth_session');
        console.log('🔧 Development mode: Session cleared');
        window.location.reload();
        return;
      }

      // Production mode - use real Cognito sign out
      await signOut();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="w-80 border-r border-gray-200 bg-gray-50 p-4">
        <div className="mb-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-white/20 bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col backdrop-blur-sm">
      {/* Header with glass effect */}
      <div className="p-4 border-b border-white/20 bg-white/60 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Conversations</h1>
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign out"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Conversation
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <svg
              className="h-12 w-12 text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-center text-sm">No conversations yet</p>
            <p className="text-center text-xs mt-1">Click "New Conversation" to start</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.conversationId}
                className={`relative group rounded-xl transition-all duration-300 ${activeConversationId === conversation.conversationId
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-2 border-blue-400/50 shadow-lg shadow-blue-500/20'
                  : 'bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:shadow-md border-2 border-white/30 hover:border-blue-300/30'
                  }`}
              >
                <button
                  onClick={() => handleSelectConversation(conversation.conversationId)}
                  className="w-full text-left p-3 pr-12"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTimestamp(conversation.lastMessageAt)}
                    </div>
                  </div>
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteConversation(conversation.conversationId, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                  title="Delete conversation"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format timestamp
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};
