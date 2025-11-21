import React, { useState } from 'react';
import { MessageSquare, CheckCircle, Send, Loader } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';
import { useAuth } from '../../contexts/AuthContext';

interface FirstPromptStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

const EXAMPLE_QUESTIONS = [
  'What were the key decisions from our last strategy meeting?',
  'Summarize our financial performance this quarter',
  'What are the main action items from recent meetings?'
];

export const FirstPromptStep: React.FC<FirstPromptStepProps> = ({ onComplete, progress }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<string>('');
  const hasAskedQuestion = progress?.step_7_first_prompt_sent || false || response;

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || !user) return;

    setIsSending(true);
    try {
      const teamId = user.user_metadata?.team_id;
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

      const requestBody = {
        sessionId: `guided-setup-${user.id}-${Date.now()}`,
        message: message.trim(),
        userId: user.id,
        userEmail: user.email,
        teamId: teamId,
        mode: 'private',
        conversationContext: []
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.response) {
        setResponse(data.response);
      } else {
        setResponse('Thank you for your question! Your first prompt has been sent successfully.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setResponse('There was an issue sending your message, but we\'ve noted that you\'ve completed this step!');
    } finally {
      setIsSending(false);
    }
  };

  const handleExampleClick = (question: string) => {
    setMessage(question);
  };

  if (hasAskedQuestion) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600/20 mb-3">
            <CheckCircle className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">First Question Complete!</h2>
          <p className="text-sm text-gray-300">You've successfully asked Astra a question and received an AI response.</p>
        </div>

        {response && (
          <div className="bg-gray-800 rounded-lg p-4 max-h-[200px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-white mb-2">Astra's Response:</h3>
            <p className="text-xs text-gray-300 whitespace-pre-wrap">{response}</p>
          </div>
        )}

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
          <p className="text-xs text-green-300">
            <span className="font-medium">✅ Great start!</span> You're now ready to explore more advanced features.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]">
            Next: Try Visualizations →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600/20 mb-3">
          <MessageSquare className="w-7 h-7 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Ask Your First Question</h2>
        <p className="text-sm text-gray-300">Try asking Astra about your data</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Example Questions:</h3>
        <div className="space-y-2">
          {EXAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(q)}
              className="w-full text-left p-2 bg-gray-900/50 hover:bg-gray-900/80 rounded-lg text-xs text-gray-300 transition-colors flex items-start gap-2"
            >
              <span>💬</span>
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your question here..."
            className="w-full bg-gray-900 text-white rounded-lg p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isSending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          <span className="font-medium">💡 Tip:</span> Click an example question or type your own to get started with Astra.
        </p>
      </div>
    </div>
  );
};
