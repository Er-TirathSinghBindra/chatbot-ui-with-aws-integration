import React, { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSendMessage(message.trim());
      setMessage(''); // Clear input on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="border-t border-white/20 bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-md p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={disabled || isLoading}
            rows={3}
            className="flex-1 resize-none rounded-2xl border border-gray-200/50 bg-white/60 backdrop-blur-sm px-4 py-3 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:bg-white/80 disabled:bg-gray-100/50 disabled:cursor-not-allowed transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={disabled || isLoading || !message.trim()}
            className="self-end rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 font-medium text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
