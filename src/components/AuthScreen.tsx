import React from 'react';
import { CustomAuth } from './CustomAuth';
import { Brain, Users, BarChart3, MessageSquare, Zap, Lock } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full space-y-12 py-8">
        <div className="max-w-md mx-auto">
          <CustomAuth />
        </div>

        {/* Preview Section */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your AI-Powered Business Command Center
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Astra Intelligence connects to all your data and provides intelligent insights to help entrepreneurs and teams make better decisions, faster.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Private AI Conversations */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Private AI Assistant</h3>
              <p className="text-gray-400 text-sm">
                Have confidential conversations with AI that understands your business context and provides personalized insights.
              </p>
            </div>

            {/* Team Collaboration */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Team Collaboration</h3>
              <p className="text-gray-400 text-sm">
                Work together with your team and AI in shared conversations. @mention team members and AI for instant insights.
              </p>
            </div>

            {/* Data Visualization */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Visualizations</h3>
              <p className="text-gray-400 text-sm">
                Turn conversations into actionable insights with AI-generated charts, graphs, and visual reports.
              </p>
            </div>

            {/* Connected Data */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">All Your Data Connected</h3>
              <p className="text-gray-400 text-sm">
                Connect Gmail, Google Drive, and more. AI analyzes your emails, documents, and data for comprehensive insights.
              </p>
            </div>

            {/* Real-Time Sync */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-yellow-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-Time Collaboration</h3>
              <p className="text-gray-400 text-sm">
                See updates instantly as your team collaborates. Everything syncs in real-time across all devices.
              </p>
            </div>

            {/* Secure & Private */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
              <p className="text-gray-400 text-sm">
                Your data is encrypted and secure. Control who sees what with team-based permissions and private conversations.
              </p>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-purple-500/10 border border-gray-700 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Built for Entrepreneurs Who Move Fast
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
                <span>Free for entrepreneurs</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>&copy; 2025 RocketHub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
