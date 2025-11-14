import React from 'react';
import { Brain, Users, BarChart3, RefreshCw, FileText, Bot, Mail, UserCircle } from 'lucide-react';

export const MarketingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full space-y-8 py-6">
        {/* Header with Branding */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="text-5xl">🚀</div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                AI Rocket
              </h1>
              <p className="text-xl text-gray-400">Astra Intelligence</p>
            </div>
          </div>
        </div>

        {/* Main Tagline */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              AI that Works for You
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built for Entrepreneurs and their Teams
            </p>
          </div>

          {/* Features Grid - 8 boxes without Secure & Private */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* 1. All Your Data Connected */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">All Your Data Connected</h3>
              <p className="text-gray-400 text-sm">
                Connect Documents, Financials, and more. AI analyzes all your data for comprehensive insights.
              </p>
            </div>

            {/* 2. Smart Visualizations */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Visualizations</h3>
              <p className="text-gray-400 text-sm">
                Turn conversations into actionable insights with AI-generated charts, graphs, and visual reports.
              </p>
            </div>

            {/* 3. Private AI Assistant */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Private AI Assistant</h3>
              <p className="text-gray-400 text-sm">
                Have confidential conversations with AI that understands your business context and provides personalized insights.
              </p>
            </div>

            {/* 4. Team Collaboration */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Team Collaboration</h3>
              <p className="text-gray-400 text-sm">
                Work together with your team and AI in shared conversations. @mention team members and AI for instant insights.
              </p>
            </div>

            {/* 5. Automated Reports */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-yellow-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Automated Reports</h3>
              <p className="text-gray-400 text-sm">
                Schedule automated reports delivered to your inbox. Stay informed with daily, weekly, or monthly insights.
              </p>
            </div>

            {/* 6. Agent Builder */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-pink-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Agent Builder</h3>
              <p className="text-gray-400 text-sm">
                Design and deploy custom AI Agents to complete tasks autonomously.
              </p>
            </div>

            {/* 7. Email Control */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-indigo-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Email Control</h3>
              <p className="text-gray-400 text-sm">
                Allow Astra to understand, analyze and manage your incoming and outgoing emails.
              </p>
            </div>

            {/* 8. AI Job Roles */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-teal-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4">
                <UserCircle className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Job Roles</h3>
              <p className="text-gray-400 text-sm">
                Create roles such as Business Coach, Finance Director, Marketing Manager and more.
              </p>
            </div>
          </div>

          {/* Closing Block Section */}
          <div className="bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-purple-500/10 border border-gray-700 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              AI That Works For You
            </h3>
            <p className="text-gray-300 text-lg mb-6 max-w-3xl mx-auto">
              Stop switching between apps. Get instant answers from your business data, collaborate with your team in real-time, and make data-driven decisions with AI-powered insights—all in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span>Built for Entrepreneurs and their Teams</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-gray-500 mt-8">
          <p>&copy; 2025 RocketHub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
