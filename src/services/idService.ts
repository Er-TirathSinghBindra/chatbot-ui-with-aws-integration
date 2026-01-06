import { v4 as uuidv4 } from 'uuid';

// Generate unique conversation ID
export const generateConversationId = (): string => {
  return `conv_${uuidv4()}`;
};

// Generate unique user message ID
export const generateUserMessageId = (): string => {
  return `user_msg_${uuidv4()}`;
};

// Generate unique system message ID
export const generateSystemMessageId = (): string => {
  return `sys_msg_${uuidv4()}`;
};
