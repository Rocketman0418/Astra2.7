import React, { useState } from 'react';
import { X, BarChart, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatAstraMessage } from '../../utils/formatAstraMessage';

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

interface VisualizationBoosterModalProps {
  onClose: () => void;
  onComplete: () => void;
  astraResponse?: string; // The response from the previous guided chat step
}

export const VisualizationBoosterModal: React.FC<VisualizationBoosterModalProps> = ({
  onClose,
  onComplete,
  astraResponse
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'show_message' | 'generating' | 'showing_viz'>('show_message');
  const [visualizationHtml, setVisualizationHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateVisualization = async () => {
    if (!user) return;

    setStep('generating');
    setError(null);

    try {
      // Fetch user data
      const userId = user.id;
      const userEmail = user.email || '';
      let teamId = '';
      let teamName = '';
      let role = 'member';
      let viewFinancial = true;
      let userName = user.email?.split('@')[0] || 'User';

      try {
        const { data: userData, error: userError } = await supabase
          .rpc('get_user_team_info', { p_user_id: userId });

        if (!userError && userData && userData.length > 0) {
          const userInfo = userData[0];
          teamId = userInfo.team_id || '';
          teamName = userInfo.team_name || '';
          role = userInfo.role || 'member';
          viewFinancial = userInfo.view_financial !== false;
          userName = userInfo.user_name || userName;
        } else {
          teamId = user.user_metadata?.team_id || '';
          role = user.user_metadata?.role || 'member';
          viewFinancial = user.user_metadata?.view_financial !== false;
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        teamId = user.user_metadata?.team_id || '';
        role = user.user_metadata?.role || 'member';
        viewFinancial = user.user_metadata?.view_financial !== false;
      }

      // Create a visualization prompt - if we have previous Astra response, reference it
      // Otherwise, create a general visualization request
      const vizPrompt = astraResponse
        ? 'Create a visualization of the data you just analyzed in your previous response'
        : 'Create a visualization showing key insights from my recent meeting notes and strategic priorities';

      // Send to webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: vizPrompt,
          user_id: userId,
          user_email: userEmail,
          user_name: userName,
          conversation_id: null,
          team_id: teamId,
          team_name: teamName,
          role: role,
          view_financial: viewFinancial,
          mode: 'private',
          request_visualization: true
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Extract visualization HTML
      let vizHtml = '';
      if (data.visualization_data) {
        vizHtml = data.visualization_data;
      } else if (data.output && data.output.includes('<div')) {
        vizHtml = data.output;
      }

      if (!vizHtml) {
        throw new Error('No visualization data received');
      }

      setVisualizationHtml(vizHtml);
      setStep('showing_viz');
    } catch (err: any) {
      console.error('Error creating visualization:', err);
      setError(err.message || 'Failed to create visualization');
      setStep('show_message');
    }
  };

  const handleProceed = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <BarChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Data Visualizations</h2>
              <p className="text-sm text-gray-300">Turn insights into visuals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Show Astra's previous message */}
          {step === 'show_message' && (
            <div className="space-y-6">
              {astraResponse && (
                <div className="bg-purple-900/10 border border-purple-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <p className="text-sm text-gray-400">Astra's Previous Insights:</p>
                  </div>
                  <div className="text-white prose prose-invert max-w-none">
                    {formatAstraMessage(astraResponse)}
                  </div>
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <BarChart className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300 font-medium mb-1">
                      Ready to Visualize?
                    </p>
                    <p className="text-sm text-gray-300">
                      Click below to transform Astra's insights into an interactive visualization. This helps you spot trends and patterns at a glance!
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Generating visualization */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
              <p className="text-white text-lg font-medium mb-2">Creating your visualization...</p>
              <p className="text-gray-400 text-sm">This may take a moment</p>

              {/* Animated progress indicators */}
              <div className="mt-8 space-y-3 max-w-md w-full">
                <div className="bg-gray-700/50 rounded-lg p-3 flex items-center gap-3 animate-pulse">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Analyzing data structure...</span>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 flex items-center gap-3 animate-pulse" style={{ animationDelay: '0.2s' }}>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Generating chart...</span>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 flex items-center gap-3 animate-pulse" style={{ animationDelay: '0.4s' }}>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Rendering visualization...</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Show visualization */}
          {step === 'showing_viz' && visualizationHtml && (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-sm text-green-300 font-medium">Visualization Created!</p>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div
                  className="w-full"
                  dangerouslySetInnerHTML={{ __html: visualizationHtml }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-800/50 flex justify-end items-center gap-3 flex-shrink-0">
          {step === 'show_message' && (
            <button
              onClick={handleCreateVisualization}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-xl font-medium min-h-[44px]"
            >
              <BarChart className="w-5 h-5" />
              Create Visualization
            </button>
          )}

          {step === 'showing_viz' && (
            <button
              onClick={handleProceed}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-xl font-medium min-h-[44px]"
            >
              <CheckCircle className="w-5 h-5" />
              Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
