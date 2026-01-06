import { getFederatedToken, refreshToken } from './authService';

let apiEndpoint = '';

// Configure API Gateway endpoint
export const configure = (endpoint: string): void => {
  apiEndpoint = endpoint;
};

// Exponential backoff retry logic
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on 4xx errors (except 401)
      if (error instanceof Response && error.status >= 400 && error.status < 500 && error.status !== 401) {
        throw lastError;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

// Send message to API Gateway
export const sendMessage = async (conversationId: string, message: string): Promise<string> => {
  if (!apiEndpoint) {
    throw new Error('API Gateway endpoint not configured. Call configure() first.');
  }

  // Check if we're in bypass auth mode (local development)
  const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

  const sendRequest = async (token?: string): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for AI response

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Only add Authorization header if we have a token (production mode)
      if (token && !BYPASS_AUTH) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversationId,
          message,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 - token expired, try to refresh (only in production mode)
      if (response.status === 401 && !BYPASS_AUTH) {
        const newToken = await refreshToken();
        // Retry with new token
        return sendRequest(newToken);
      }

      // Handle other 4xx errors
      if (response.status >= 400 && response.status < 500) {
        const errorBody = await response.text();
        throw new Error(`Client error (${response.status}): ${errorBody || response.statusText}`);
      }

      // Handle 5xx errors
      if (response.status >= 500) {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }

      // Success - parse response
      const data = await response.json();
      return data.response || data.message || JSON.stringify(data);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout: API did not respond within 30 seconds');
        }
        throw error;
      }

      throw new Error('Failed to send message to API Gateway');
    }
  };

  try {
    // In bypass auth mode, skip token retrieval
    if (BYPASS_AUTH) {
      console.log('🔧 Development mode: Skipping authentication for API call');
      return await retryWithBackoff(() => sendRequest());
    }

    // Production mode - get token
    const token = await getFederatedToken();
    return await retryWithBackoff(() => sendRequest(token));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API Gateway error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while sending message');
  }
};
