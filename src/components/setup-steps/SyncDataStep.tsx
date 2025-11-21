import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SyncDataStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

export const SyncDataStep: React.FC<SyncDataStepProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasSyncedData, setHasSyncedData] = useState(false);
  const [chunkCounts, setChunkCounts] = useState<{ meetings: number; strategy: number; financial: number }>({ meetings: 0, strategy: 0, financial: 0 });

  useEffect(() => {
    checkSyncedData();
  }, [user]);

  const checkSyncedData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const teamId = user.user_metadata?.team_id;
      if (teamId) {
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
        setHasSyncedData(counts.meetings > 0 || counts.strategy > 0 || counts.financial > 0);
      }
    } catch (error) {
      console.error('Error checking synced data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600/20 mb-4">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Sync Your Data</h2>
          <p className="text-gray-300">Checking your synced data...</p>
        </div>
      </div>
    );
  }

  if (hasSyncedData) {
    const totalChunks = chunkCounts.meetings + chunkCounts.strategy + chunkCounts.financial;
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600/20 mb-4">
            <CheckCircle className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Data Successfully Synced!</h2>
          <p className="text-gray-300">Your documents have been processed and are ready for AI analysis.</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sync Summary</h3>
          <div className="space-y-3">
            {chunkCounts.meetings > 0 && (
              <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-white font-medium">Meetings Data</p>
                    <p className="text-xs text-gray-400">{chunkCounts.meetings.toLocaleString()} chunks processed</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            )}
            {chunkCounts.strategy > 0 && (
              <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-white font-medium">Strategy Data</p>
                    <p className="text-xs text-gray-400">{chunkCounts.strategy.toLocaleString()} chunks processed</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            )}
            {chunkCounts.financial > 0 && (
              <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="text-white font-medium">Financial Data</p>
                    <p className="text-xs text-gray-400">{chunkCounts.financial.toLocaleString()} chunks processed</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">Total: <span className="text-white font-medium">{totalChunks.toLocaleString()} chunks</span> ready for AI queries</p>
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <p className="text-sm text-green-300">
            <span className="font-medium">✅ Sync Complete!</span> Astra can now answer questions about your documents.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]">
            Next: Ask Your First Question →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600/20 mb-4">
          <RefreshCw className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Sync Your Data</h2>
        <p className="text-gray-300">Process your documents so Astra can analyze them</p>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-300">
              <span className="font-medium">No synced data found.</span> Your documents need to be processed by the n8n workflow. This happens automatically once files are added to your folders.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">What Happens During Sync:</h3>
        <div className="space-y-3">
          {['Documents are read from your Google Drive folders', 'Content is chunked and vectorized for AI search', 'Data is securely stored in your team database', 'Astra can now answer questions about your content'].map((item, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]">
          Continue →
        </button>
      </div>
    </div>
  );
};
