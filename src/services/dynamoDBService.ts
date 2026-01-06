import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Message, Conversation, DynamoDBMessageItem, DynamoDBConversationItem } from '../types';

// DynamoDB client instance
let dynamoDBClient: DynamoDBDocumentClient | null = null;
let chatHistoryTableName = '';
let conversationsTableName = '';

// Configure DynamoDB client with Cognito credentials
export const configure = async (config: {
  region: string;
  chatHistoryTable: string;
  conversationsTable: string;
}) => {
  try {
    // Get Cognito credentials
    const session = await fetchAuthSession();
    const credentials = session.credentials;

    if (!credentials) {
      throw new Error('No credentials available from Cognito session');
    }

    // Create DynamoDB client
    const client = new DynamoDBClient({
      region: config.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    // Create document client for easier operations
    dynamoDBClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
    });

    // Store table names
    chatHistoryTableName = config.chatHistoryTable;
    conversationsTableName = config.conversationsTable;

    return dynamoDBClient;
  } catch (error) {
    throw new Error(
      `Failed to configure DynamoDB client: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Get configured client or throw error
const getClient = (): DynamoDBDocumentClient => {
  if (!dynamoDBClient) {
    throw new Error('DynamoDB client not configured. Call configure() first.');
  }
  return dynamoDBClient;
};

// Save a message to ChatHistory table
export const saveMessage = async (conversationId: string, message: Message): Promise<void> => {
  const client = getClient();

  const item: DynamoDBMessageItem = {
    conversationId,
    timestamp: message.timestamp,
    messageId: message.messageId,
    messageType: message.messageType,
    content: message.content,
    status: message.status,
  };

  try {
    await client.send(
      new PutCommand({
        TableName: chatHistoryTableName,
        Item: item,
      })
    );
  } catch (error) {
    throw new Error(
      `Failed to save message: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Load conversation messages from ChatHistory table
export const loadConversation = async (conversationId: string): Promise<Message[]> => {
  const client = getClient();
  const messages: Message[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  try {
    do {
      const response = await client.send(
        new QueryCommand({
          TableName: chatHistoryTableName,
          KeyConditionExpression: 'conversationId = :conversationId',
          ExpressionAttributeValues: {
            ':conversationId': conversationId,
          },
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

      if (response.Items) {
        const items = response.Items as DynamoDBMessageItem[];
        messages.push(
          ...items.map((item) => ({
            messageId: item.messageId,
            conversationId: item.conversationId,
            messageType: item.messageType,
            content: item.content,
            timestamp: item.timestamp,
            status: item.status as Message['status'],
          }))
        );
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Sort by timestamp
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    throw new Error(
      `Failed to load conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Create a new conversation in Conversations table
export const createConversation = async (conversationId: string): Promise<void> => {
  const client = getClient();
  const now = Date.now();

  const item: DynamoDBConversationItem = {
    conversationId,
    title: 'New Conversation',
    createdAt: now,
    lastMessageAt: now,
    messageCount: 0,
  };

  try {
    await client.send(
      new PutCommand({
        TableName: conversationsTableName,
        Item: item,
      })
    );
  } catch (error) {
    throw new Error(
      `Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// List all conversations from Conversations table
export const listConversations = async (): Promise<Conversation[]> => {
  const client = getClient();
  const conversations: Conversation[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  try {
    do {
      const response = await client.send(
        new ScanCommand({
          TableName: conversationsTableName,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

      if (response.Items) {
        const items = response.Items as DynamoDBConversationItem[];
        conversations.push(
          ...items.map((item) => ({
            conversationId: item.conversationId,
            title: item.title,
            createdAt: item.createdAt,
            lastMessageAt: item.lastMessageAt,
            messageCount: item.messageCount,
          }))
        );
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Sort by lastMessageAt descending (most recent first)
    return conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  } catch (error) {
    throw new Error(
      `Failed to list conversations: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Update conversation metadata
export const updateConversation = async (
  conversationId: string,
  updates: Partial<Conversation>
): Promise<void> => {
  const client = getClient();

  // Build update expression dynamically
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  if (updates.title !== undefined) {
    updateExpressions.push('#title = :title');
    expressionAttributeNames['#title'] = 'title';
    expressionAttributeValues[':title'] = updates.title;
  }

  if (updates.lastMessageAt !== undefined) {
    updateExpressions.push('#lastMessageAt = :lastMessageAt');
    expressionAttributeNames['#lastMessageAt'] = 'lastMessageAt';
    expressionAttributeValues[':lastMessageAt'] = updates.lastMessageAt;
  }

  if (updates.messageCount !== undefined) {
    updateExpressions.push('#messageCount = :messageCount');
    expressionAttributeNames['#messageCount'] = 'messageCount';
    expressionAttributeValues[':messageCount'] = updates.messageCount;
  }

  if (updateExpressions.length === 0) {
    return; // Nothing to update
  }

  try {
    await client.send(
      new UpdateCommand({
        TableName: conversationsTableName,
        Key: { conversationId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
  } catch (error) {
    throw new Error(
      `Failed to update conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Delete conversation and all its messages
export const deleteConversation = async (conversationId: string): Promise<void> => {
  const client = getClient();

  try {
    // First, delete all messages in the conversation
    const messages = await loadConversation(conversationId);
    
    // Delete messages in batches (DynamoDB batch write limit is 25)
    const batchSize = 25;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const deleteRequests = batch.map((msg) => ({
        DeleteRequest: {
          Key: {
            conversationId: msg.conversationId,
            timestamp: msg.timestamp,
          },
        },
      }));

      if (deleteRequests.length > 0) {
        await client.send({
          RequestItems: {
            [chatHistoryTableName]: deleteRequests,
          },
        } as any);
      }
    }

    // Then delete the conversation itself
    await client.send({
      TableName: conversationsTableName,
      Key: { conversationId },
    } as any);
  } catch (error) {
    throw new Error(
      `Failed to delete conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
