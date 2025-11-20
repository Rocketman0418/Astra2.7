import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Database, Code, Lock, BarChart3, Send, Loader2, ChevronRight, Sparkles, CheckCircle, Clock, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getMCPStrategyResponse } from '../lib/mcp-strategy-assistant';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

export const MCPStrategyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hello! I'm your guide to the MCP Backend/Client Architecture strategy. Ask me anything about the implementation plan, technical architecture, use cases, or roadmap!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sections: Section[] = [
    {
      id: 'overview',
      icon: Server,
      title: 'Architecture Overview',
      description: 'Core design, components, and data flow',
      color: 'blue'
    },
    {
      id: 'database',
      icon: Database,
      title: 'Database Schema',
      description: 'Tables, RLS policies, and relationships',
      color: 'green'
    },
    {
      id: 'implementation',
      icon: Code,
      title: 'Implementation',
      description: 'Edge functions, frontend services, and integration',
      color: 'purple'
    },
    {
      id: 'security',
      icon: Lock,
      title: 'Security',
      description: 'Credential management and access control',
      color: 'red'
    },
    {
      id: 'roadmap',
      icon: Clock,
      title: 'Implementation Roadmap',
      description: '10-week phased rollout plan',
      color: 'orange'
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: 'Analytics & Monitoring',
      description: 'Success metrics and performance tracking',
      color: 'cyan'
    }
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const question = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await getMCPStrategyResponse(question);

      const astraMessage: Message = {
        id: `astra-${Date.now()}`,
        text: responseText,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, astraMessage]);
    } catch (error: any) {
      console.error('Error getting strategy response:', error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: error?.message || "I'm having trouble processing your request. Please try again in a moment.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What is the MCP Backend/Client Architecture?",
    "How does the security model work?",
    "What are the implementation phases?",
    "What are the key use cases?",
    "How does tool execution work?",
    "What's the database schema design?"
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Back</span>
              </button>
              <div className="h-8 w-px bg-gray-700" />
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">MCP Backend/Client Architecture</h1>
                  <p className="text-xs text-gray-400">Strategic Implementation Plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl p-8 mb-8 border border-blue-800/30">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3">Transform Astra with MCP Integration</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Enable Astra to connect to any MCP server (n8n workflows, filesystems, databases, APIs) through a centralized backend client. Provide team-wide access to powerful tools and data sources through simple conversational AI interactions.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2 bg-gray-900/50 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Web-Native Integration</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-900/50 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Team-Centric Management</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-900/50 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Mobile-First</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-900/50 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Enterprise Security</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sections Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <span>Explore Strategy</span>
              </h3>
              <div className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-start space-x-3 p-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-900/50 hover:bg-gray-900 text-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-white' : `text-${section.color}-400`}`} />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{section.title}</div>
                        <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                          {section.description}
                        </div>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ask Astra Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 h-[calc(100vh-20rem)] flex flex-col">
              {/* Header */}
              <div className="flex items-start space-x-3 mb-4 pb-4 border-b border-gray-700">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-blue-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Ask Astra About MCP Strategy</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Powered by Gemini AI. Ask anything about the architecture, implementation, security, or roadmap.
                  </p>
                </div>
              </div>

              {/* Suggested Questions */}
              {messages.length <= 1 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Suggested Questions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestedQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputValue(question)}
                        className="text-left text-xs bg-gray-900/50 hover:bg-gray-900 border border-gray-700 hover:border-blue-500/50 rounded-lg p-2 transition-all"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 ${
                        message.isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-900/70 border border-gray-700 text-gray-100'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                      <div
                        className={`text-xs mt-2 ${
                          message.isUser ? 'text-blue-200' : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask about architecture, implementation, security, use cases..."
                      disabled={isLoading}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
