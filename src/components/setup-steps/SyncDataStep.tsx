import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SyncDataStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

const ROTATING_QUESTIONS = [
  "What is our team's mission and how can we better align our daily work with it?",
  "What are the top 3 strategic priorities we should focus on this quarter?",
  "How do our core values show up in our recent team decisions and meetings?",
  "What progress have we made toward our one-year goals?",
  "Are there any gaps between our stated goals and our actual activities?",
  "What unique strengths does our team have that we should leverage more?",
  "How can we better communicate our strategic direction to new team members?",
  "What metrics should we track to ensure we're moving in the right direction?",
  "How do our current projects align with our three-year vision?",
  "What problems are we solving that matter most to our customers?"
];

export const SyncDataStep: React.FC<SyncDataStepProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(true);
  const [syncComplete, setSyncComplete] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chunkCounts, setChunkCounts] = useState<{ meetings: number; strategy: number; financial: number }>({ meetings: 0, strategy: 0, financial: 0 });
  const [checkAttempts, setCheckAttempts] = useState(0);
  const maxCheckAttempts = 30; // Check for up to 60 seconds (30 * 2s intervals)

  useEffect(() => {
    // Start syncing process
    triggerSync();
  }, []);

  useEffect(() => {
    // Rotate questions every 5 seconds while syncing
    if (syncing && !syncComplete) {
      const interval = setInterval(() => {
        setCurrentQuestionIndex((prev) => (prev + 1) % ROTATING_QUESTIONS.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [syncing, syncComplete]);

  useEffect(() => {
    // Poll for synced data every 2 seconds
    if (syncing && !syncComplete) {
      const interval = setInterval(() => {
        checkSyncedData();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [syncing, syncComplete]);

  const triggerSync = async () => {
    console.log('Triggering document sync...');
    setSyncing(true);

    try {
      // Get user's team info
      const teamId = user?.user_metadata?.team_id;
      if (!teamId) {
        console.error('No team ID found for user');
        return;
      }

      // Trigger the n8n webhook for the Multi-Team Data Sync Agent
      const webhookUrl = 'https://healthrocket.app.n8n.cloud/webhook/21473ebb-405d-4be1-ab71-6bf2a2d4063b';

      console.log('Calling n8n webhook to trigger sync for team:', teamId);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          trigger_source: 'guided_setup',
          immediate: true,
        }),
      });

      if (!response.ok) {
        console.error('Failed to trigger sync webhook:', response.status, response.statusText);
      } else {
        console.log('Sync webhook triggered successfully');
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
    }

    // Start checking for data immediately
    checkSyncedData();
  };

  const checkSyncedData = async () => {
    if (!user || syncComplete) return;

    try {
      const teamId = user.user_metadata?.team_id;
      if (!teamId) return;

      const [meetingsData, strategyData, financialData] = await Promise.all([
        supabase.from('document_chunks_meetings').select('id', { count: 'exact', head: true }).eq('team_id', teamId),
        supabase.from('document_chunks_strategy').select('id', { count: 'exact', head: true }).eq('team_id', teamId),
        supabase.from('document_chunks_financial').select('id', { count: 'exact', head: true }).eq('team_id', teamId)
      ]);

      const counts = {
        meetings: meetingsData.count || 0,
        strategy: strategyData.count || 0,
        financial: financialData.count || 0
      };

      setChunkCounts(counts);

      // Check if we have any synced data
      if (counts.meetings > 0 || counts.strategy > 0 || counts.financial > 0) {
        setSyncing(false);
        setSyncComplete(true);
      } else {
        // Increment check attempts
        setCheckAttempts(prev => prev + 1);

        // If we've exceeded max attempts, stop syncing
        if (checkAttempts >= maxCheckAttempts) {
          setSyncing(false);
          // syncComplete stays false
        }
      }
    } catch (error) {
      console.error('Error checking synced data:', error);
    }
  };

  // Syncing in progress view
  if (syncing && !syncComplete) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 mb-6 animate-pulse">
            <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Syncing Your Documents...</h2>
          <p className="text-gray-300 mb-2">
            Astra is processing your strategy documents and will be ready shortly
          </p>
          <p className="text-sm text-gray-400">
            This may take a minute or two depending on the number of documents
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-progress-indeterminate" />
          </div>
        </div>

        {/* Rotating Questions */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg p-6 min-h-[200px] flex flex-col items-center justify-center">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Questions You'll Be Able to Ask Astra:</h3>
          </div>
          <div className="text-center">
            <p className="text-lg text-purple-200 italic transition-opacity duration-500">
              "{ROTATING_QUESTIONS[currentQuestionIndex]}"
            </p>
          </div>
          <div className="mt-6 flex items-center space-x-2">
            {ROTATING_QUESTIONS.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentQuestionIndex
                    ? 'w-8 bg-purple-400'
                    : 'w-2 bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <span className="font-medium">💡 What's happening:</span> Your documents are being read, chunked, and vectorized for intelligent search. Once complete, Astra will have deep insights into your team's strategy, mission, and goals.
          </p>
        </div>
      </div>
    );
  }

  // Sync complete view
  if (syncComplete) {
    const totalChunks = chunkCounts.meetings + chunkCounts.strategy + chunkCounts.financial;
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-600/20 mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Sync Complete!</h2>
          <p className="text-gray-300">
            Your documents have been successfully processed and Astra is ready to help
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Sync Summary
          </h3>
          <div className="space-y-3">
            {chunkCounts.strategy > 0 && (
              <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">🎯</span>
                  <div>
                    <p className="text-white font-medium">Strategy Documents</p>
                    <p className="text-xs text-gray-400">{chunkCounts.strategy.toLocaleString()} chunks processed</p>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            )}
            {chunkCounts.meetings > 0 && (
              <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">📊</span>
                  <div>
                    <p className="text-white font-medium">Meeting Notes</p>
                    <p className="text-xs text-gray-400">{chunkCounts.meetings.toLocaleString()} chunks processed</p>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            )}
            {chunkCounts.financial > 0 && (
              <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">💰</span>
                  <div>
                    <p className="text-white font-medium">Financial Documents</p>
                    <p className="text-xs text-gray-400">{chunkCounts.financial.toLocaleString()} chunks processed</p>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Total: <span className="text-white font-medium">{totalChunks.toLocaleString()} chunks</span> ready for AI-powered insights
            </p>
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-400" />
            What Astra Can Do Now:
          </h4>
          <ul className="space-y-2 text-sm text-green-300">
            <li className="flex items-start space-x-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>Answer questions about your team's mission, values, and strategic direction</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>Provide insights on your goals and help track progress toward objectives</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>Analyze alignment between strategy documents and team activities</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>Generate reports and visualizations based on your synced data</span>
            </li>
          </ul>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={onComplete}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl min-h-[44px]"
          >
            Next: Configure Team Settings →
          </button>
        </div>
      </div>
    );
  }

  // No data found after waiting
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-600/20 mb-4">
          <AlertCircle className="w-8 h-8 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Sync Not Complete Yet</h2>
        <p className="text-gray-300">
          Documents are still being processed. This can take a few minutes.
        </p>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <p className="text-sm text-yellow-300">
          <span className="font-medium">⏳ Please wait:</span> The document sync is handled by our n8n workflow and may take 2-5 minutes depending on the number and size of documents. You can continue with the setup and check back later.
        </p>
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <button
          onClick={() => {
            setCheckAttempts(0);
            setSyncing(true);
            checkSyncedData();
          }}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 min-h-[44px]"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Check Again</span>
        </button>
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]"
        >
          Continue Anyway →
        </button>
      </div>
    </div>
  );
};
