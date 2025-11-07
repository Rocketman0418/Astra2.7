import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getHelpResponse, saveHelpConversation, getHelpConversations } from '../lib/help-assistant';

interface Message {
  id: string;
  question: string;
  response: string;
  created_at: string;
}

export function HelpAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversationHistory();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadConversationHistory = async () => {
    if (!user) return;

    try {
      setIsLoadingHistory(true);
      const history = await getHelpConversations(user.id);
      setMessages(history);
    } catch (error) {
      console.error('Error loading help conversation history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || isLoading) return;

    const question = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await getHelpResponse(question);

      await saveHelpConversation(user.id, question, response);

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        question,
        response,
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error getting help response:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        question,
        response: 'Sorry, I encountered an error. Please try again or check the FAQ section for common questions.',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">
              Ask Astra for Help
            </h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              I can help you learn how to use Astra Intelligence. Ask me anything about features, settings, or how to get started!
            </p>
            <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
              <button
                onClick={() => setInput('What kind of questions can I ask Astra to get the best responses?')}
                className="w-full text-left px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                What kind of questions can I ask Astra to get the best responses?
              </button>
              <button
                onClick={() => setInput('What\'s the difference between Private and Team chat?')}
                className="w-full text-left px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                What's the difference between Private and Team chat?
              </button>
              <button
                onClick={() => setInput('What are Reports and how can I use them?')}
                className="w-full text-left px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                What are Reports and how can I use them?
              </button>
              <button
                onClick={() => setInput('How do I create, save and export visualizations?')}
                className="w-full text-left px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                How do I create, save and export visualizations?
              </button>
              <button
                onClick={() => setInput('How does Astra understand me, our team, and our data?')}
                className="w-full text-left px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                How does Astra understand me, our team, and our data?
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%]">
                <p className="text-sm">{message.question}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.response}</p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-sm text-gray-400">Astra is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about using Astra..."
            disabled={isLoading}
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-purple-500 focus:outline-none transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
