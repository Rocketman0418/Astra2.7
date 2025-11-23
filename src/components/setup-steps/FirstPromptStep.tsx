import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, CheckCircle, Send, Loader, Sparkles, BarChart3 } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface FirstPromptStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

interface AvailableDataTypes {
  hasStrategy: boolean;
  hasMeetings: boolean;
  hasFinancial: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const getContextualQuestions = (dataTypes: AvailableDataTypes): string[] => {
  const { hasStrategy, hasMeetings, hasFinancial } = dataTypes;
  const questions: string[] = [];

  // Strategy questions
  if (hasStrategy) {
    questions.push('What is our team\'s mission and core values?');
    questions.push('What are our current strategic goals?');
    questions.push('How does our strategy address market challenges?');
  }

  // Meetings questions
  if (hasMeetings) {
    questions.push('What were the key decisions from our last strategy meeting?');
    questions.push('What are the main action items from recent meetings?');
    questions.push('Summarize the discussion topics from this week\'s meetings');
  }

  // Financial questions
  if (hasFinancial) {
    questions.push('Summarize our financial performance this quarter');
    questions.push('What are our main revenue streams?');
    questions.push('What are our biggest expenses?');
  }

  // If no data types, provide generic questions
  if (questions.length === 0) {
    questions.push('Tell me about the documents you have access to');
    questions.push('What information can you help me with?');
  }

  // Return max 3 questions
  return questions.slice(0, 3);
};

export const FirstPromptStep: React.FC<FirstPromptStepProps> = ({ onComplete, progress }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [dataTypes, setDataTypes] = useState<AvailableDataTypes>({
    hasStrategy: false,
    hasMeetings: false,
    hasFinancial: false,
  });
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
  const [showVisualizationHint, setShowVisualizationHint] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasAskedQuestion = progress?.step_7_first_prompt_sent || messages.some(m => m.role === 'assistant');

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check what document types exist for the team
  useEffect(() => {
    const checkAvailableData = async () => {
      if (!user) return;

      const teamId = user.user_metadata?.team_id;
      if (!teamId) return;

      try {
        // Check for documents in each category
        const { data: strategyDocs } = await supabase
          .from('documents')
          .select('id')
          .eq('team_id', teamId)
          .eq('folder_type', 'strategy')
          .limit(1);

        const { data: meetingDocs } = await supabase
          .from('documents')
          .select('id')
          .eq('team_id', teamId)
          .eq('folder_type', 'meetings')
          .limit(1);

        const { data: financialDocs } = await supabase
          .from('documents')
          .select('id')
          .eq('team_id', teamId)
          .eq('folder_type', 'financial')
          .limit(1);

        const types: AvailableDataTypes = {
          hasStrategy: (strategyDocs?.length ?? 0) > 0,
          hasMeetings: (meetingDocs?.length ?? 0) > 0,
          hasFinancial: (financialDocs?.length ?? 0) > 0,
        };

        setDataTypes(types);
        setExampleQuestions(getContextualQuestions(types));
      } catch (error) {
        console.error('Error checking available data:', error);
        // Fallback to generic questions
        setExampleQuestions(getContextualQuestions({
          hasStrategy: false,
          hasMeetings: false,
          hasFinancial: false,
        }));
      }
    };

    checkAvailableData();
  }, [user]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending || !user) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsSending(true);

    // Add "Astra is thinking..." message
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const teamId = user.user_metadata?.team_id;
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

      const requestBody = {
        sessionId: `guided-setup-${user.id}-${Date.now()}`,
        message: userMessage.content,
        userId: user.id,
        userEmail: user.email,
        teamId: teamId,
        mode: 'private',
        conversationContext: messages
          .filter(m => m.role === 'user' || (m.role === 'assistant' && m.content))
          .map(m => ({ role: m.role, content: m.content }))
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      // Remove thinking message and add actual response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== thinkingMessage.id);
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response || 'I received your message! Let me help you with that.',
          timestamp: new Date(),
        };
        return [...filtered, assistantMessage];
      });

      // Show visualization hint after first response
      setShowVisualizationHint(true);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove thinking message and add error response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== thinkingMessage.id);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I encountered an issue processing your request. Please try again.',
          timestamp: new Date(),
        };
        return [...filtered, errorMessage];
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleExampleClick = (question: string) => {
    setMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // If we have messages and visualization hint, show completion state
  if (hasAskedQuestion && showVisualizationHint) {
    return (
      <div className="space-y-4">
        {/* Chat History */}
        <div className="bg-gray-800 rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.content
                    ? 'bg-purple-900/30 border border-purple-700 text-gray-200'
                    : 'bg-gray-700/50 text-gray-400'
                }`}
              >
                {msg.content || (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm italic">Astra is thinking...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Visualization Hint */}
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Great Job! Next: Try a Visualization
              </h3>
              <p className="text-sm text-green-300 mb-3">
                Now that you've seen how Astra responds, let's create a visual representation of your data. In the next step, you'll learn how to generate charts, graphs, and other visualizations from Astra's responses.
              </p>
              <div className="bg-green-950/50 border border-green-800 rounded-lg p-3">
                <p className="text-xs text-green-200 mb-2">
                  <span className="font-semibold">💡 What you'll learn:</span>
                </p>
                <ul className="text-xs text-green-300 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>How to turn Astra's text responses into visual charts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Different visualization types (bar charts, pie charts, timelines)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Saving and sharing visualizations with your team</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={onComplete}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px] flex items-center gap-2"
          >
            Next: Create a Visualization
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Initial chat interface
  return (
    <div className="space-y-4">
      {/* Header with Icon */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 mb-3">
          <MessageSquare className="w-7 h-7 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Ask Your First Question</h2>
        <p className="text-sm text-gray-300">Try asking Astra about your data</p>
      </div>

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.content
                    ? 'bg-purple-900/30 border border-purple-700 text-gray-200'
                    : 'bg-gray-700/50 text-gray-400'
                }`}
              >
                {msg.content || (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm italic">Astra is thinking...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Example Questions */}
      {messages.length === 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Example Questions:</h3>
          </div>
          <div className="space-y-2">
            {exampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(q)}
                className="w-full text-left p-3 bg-gray-900/50 hover:bg-gray-900/80 rounded-lg text-sm text-gray-300 transition-all hover:border hover:border-purple-500/50 flex items-start gap-2 group"
              >
                <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question here or click an example above..."
            className="w-full bg-gray-900 text-white rounded-lg p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            {isSending ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Tip */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
        <p className="text-xs text-blue-300 flex items-start gap-2">
          <span className="text-lg flex-shrink-0">💡</span>
          <span>
            <span className="font-medium">Tip:</span> Click an example question or type your own to see how Astra analyzes your data in real-time. Press Enter to send or Shift+Enter for a new line.
          </span>
        </p>
      </div>
    </div>
  );
};
