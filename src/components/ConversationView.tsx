import React, { useEffect, useState } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useAppContext } from '../context/AppContext';
import { loadConversation, saveMessage, updateConversation } from '../services/dynamoDBService';
import { sendMessage as sendToAPI } from '../services/apiGatewayService';
import { generateUserMessageId, generateSystemMessageId } from '../services/idService';
import type { Message } from '../types';

export const ConversationView: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { activeConversationId, messages } = state;
  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  // Development mode bypass
  const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const USE_LOCAL_STORAGE = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use mock data in development mode
        if (USE_MOCK_DATA) {
          console.log('🔧 Development mode: Using mock messages');
          const mockMessages: Message[] = [
            {
              messageId: 'user_msg_1',
              conversationId: activeConversationId,
              messageType: 'user',
              content: 'Hello! This is a sample message.',
              timestamp: Date.now() - 60000,
              status: 'sent',
            },
            {
              messageId: 'sys_msg_1',
              conversationId: activeConversationId,
              messageType: 'system',
              content: 'Hi! This is a mock response from the system. In production, this would come from your API Gateway.',
              timestamp: Date.now() - 55000,
              status: 'sent',
            },
          ];
          dispatch({
            type: 'SET_MESSAGES',
            payload: {
              conversationId: activeConversationId,
              messages: mockMessages,
            },
          });
          setLoading(false);
          return;
        }

        // Use local storage in dev mode
        if (USE_LOCAL_STORAGE) {
          console.log('🔧 Development mode: Using local storage');
          const storedMessages = localStorage.getItem(`messages_${activeConversationId}`);
          const conversationMessages = storedMessages ? JSON.parse(storedMessages) : [];
          dispatch({
            type: 'SET_MESSAGES',
            payload: {
              conversationId: activeConversationId,
              messages: conversationMessages,
            },
          });
          setLoading(false);
          return;
        }

        const conversationMessages = await loadConversation(activeConversationId);
        dispatch({
          type: 'SET_MESSAGES',
          payload: {
            conversationId: activeConversationId,
            messages: conversationMessages,
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [activeConversationId, dispatch, USE_MOCK_DATA]);

  const handleSendMessage = async (content: string) => {
    if (!activeConversationId) {
      throw new Error('No active conversation');
    }

    const userMessageId = generateUserMessageId();
    const timestamp = Date.now();

    // Create user message
    const userMessage: Message = {
      messageId: userMessageId,
      conversationId: activeConversationId,
      messageType: 'user',
      content,
      timestamp,
      status: 'sending',
    };

    // Optimistic UI update - add user message immediately
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        conversationId: activeConversationId,
        message: userMessage,
      },
    });

    try {
      // Mock mode - simulate API response
      if (USE_MOCK_DATA) {
        console.log('🔧 Development mode: Simulating message send');
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update message status to sent
        dispatch({
          type: 'UPDATE_MESSAGE_STATUS',
          payload: {
            conversationId: activeConversationId,
            messageId: userMessageId,
            status: 'sent',
          },
        });

        // Create mock system response
        const systemMessageId = generateSystemMessageId();
        const systemMessage: Message = {
          messageId: systemMessageId,
          conversationId: activeConversationId,
          messageType: 'system',
          content: `Mock response to: "${content}". In production, this would be the actual API response.`,
          timestamp: Date.now(),
          status: 'sent',
        };

        // Add system message to UI
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            conversationId: activeConversationId,
            message: systemMessage,
          },
        });

        // Update conversation in state
        dispatch({
          type: 'UPDATE_CONVERSATION',
          payload: {
            conversationId: activeConversationId,
            updates: {
              lastMessageAt: Date.now(),
              messageCount: currentMessages.length + 2,
              title: currentMessages.length === 0 ? content.substring(0, 50) : undefined,
            },
          },
        });

        return;
      }

      // Local storage mode - real API but local persistence
      if (USE_LOCAL_STORAGE) {
        console.log('🔧 Development mode: Using real API with local storage');

        // Update message status to sent
        dispatch({
          type: 'UPDATE_MESSAGE_STATUS',
          payload: {
            conversationId: activeConversationId,
            messageId: userMessageId,
            status: 'sent',
          },
        });

        // Save user message to local storage
        const updatedMessages = [...currentMessages, { ...userMessage, status: 'sent' }];
        localStorage.setItem(`messages_${activeConversationId}`, JSON.stringify(updatedMessages));

        // Send to API Gateway
        const response = await sendToAPI(activeConversationId, content);

        // Create system message
        const systemMessageId = generateSystemMessageId();
        const systemMessage: Message = {
          messageId: systemMessageId,
          conversationId: activeConversationId,
          messageType: 'system',
          content: response,
          timestamp: Date.now(),
          status: 'sent',
        };

        // Add system message to UI
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            conversationId: activeConversationId,
            message: systemMessage,
          },
        });

        // Save system message to local storage
        const finalMessages = [...updatedMessages, systemMessage];
        localStorage.setItem(`messages_${activeConversationId}`, JSON.stringify(finalMessages));

        // Update conversation in state
        dispatch({
          type: 'UPDATE_CONVERSATION',
          payload: {
            conversationId: activeConversationId,
            updates: {
              lastMessageAt: Date.now(),
              messageCount: finalMessages.length,
              title: currentMessages.length === 0 ? content.substring(0, 50) : undefined,
            },
          },
        });

        return;
      }

      // Production mode - real AWS integration
      // Save user message to DynamoDB
      await saveMessage(activeConversationId, userMessage);

      // Update message status to sent
      dispatch({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: {
          conversationId: activeConversationId,
          messageId: userMessageId,
          status: 'sent',
        },
      });

      // Send to API Gateway
      const response = await sendToAPI(activeConversationId, content);

      // Create system message
      const systemMessageId = generateSystemMessageId();
      const systemMessage: Message = {
        messageId: systemMessageId,
        conversationId: activeConversationId,
        messageType: 'system',
        content: response,
        timestamp: Date.now(),
        status: 'sent',
      };

      // Add system message to UI
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          conversationId: activeConversationId,
          message: systemMessage,
        },
      });

      // Save system message to DynamoDB
      await saveMessage(activeConversationId, systemMessage);

      // Update conversation metadata
      const messageCount = currentMessages.length + 2; // +2 for user and system messages
      await updateConversation(activeConversationId, {
        lastMessageAt: Date.now(),
        messageCount,
        title: currentMessages.length === 0 ? content.substring(0, 50) : undefined,
      });

      // Update conversation in state
      dispatch({
        type: 'UPDATE_CONVERSATION',
        payload: {
          conversationId: activeConversationId,
          updates: {
            lastMessageAt: Date.now(),
            messageCount,
            title: currentMessages.length === 0 ? content.substring(0, 50) : undefined,
          },
        },
      });
    } catch (err) {
      // Update message status to error
      dispatch({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: {
          conversationId: activeConversationId,
          messageId: userMessageId,
          status: 'error',
        },
      });

      throw err;
    }
  };

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="mt-4 text-lg font-medium">No conversation selected</p>
          <p className="mt-1 text-sm">Select a conversation or create a new one to start chatting</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
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
          <p className="text-lg font-medium text-gray-900">Error loading conversation</p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <MessageList messages={currentMessages} loading={loading} />
      <MessageInput onSendMessage={handleSendMessage} disabled={loading} />
    </div>
  );
};
