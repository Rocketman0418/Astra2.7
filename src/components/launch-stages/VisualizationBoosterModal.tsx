import React, { useState } from 'react';
import { X, BarChart, Send, Sparkles, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface VisualizationBoosterModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export const VisualizationBoosterModal: React.FC<VisualizationBoosterModalProps> = ({ onClose, onComplete }) => {
  const { user } = useAuth();
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const suggestedPrompts = [
    'Show me a bar chart of my strategy documents by type',
    'Create a timeline of my recent meetings',
    'Visualize my project status distribution',
    'Show meeting frequency trends over time'
  ];

  const handlePromptSelect = (prompt: string) => {
    setUserPrompt(prompt);
  };

  const handleGenerateVisualization = async () => {
    if (!userPrompt.trim()) {
      setErrorMessage('Please enter a prompt for your visualization');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');

    try {
      // Save the chat message to trigger visualization
      const { error: chatError } = await supabase
        .from('astra_chats')
        .insert({
          user_id: user?.id,
          message: userPrompt,
          mode: 'private',
          context_type: 'visualization',
          metadata: { from_launch_prep: true }
        });

      if (chatError) throw chatError;

      // Complete the achievement
      await onComplete();
    } catch (error) {
      console.error('Error generating visualization:', error);
      setErrorMessage('Failed to generate visualization. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <BarChart className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Data Visualizations</h2>
              <p className="text-sm text-gray-400">Turn your data into visual insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Introduction */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium mb-1">
                  Unlock the Power of Visual Insights
                </p>
                <p className="text-sm text-gray-300">
                  Ask Astra to visualize your data and get instant, interactive charts and graphs. Perfect for spotting trends, comparing metrics, and making data-driven decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Suggested Prompts */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Try These Visualization Prompts:</h3>
            <div className="grid grid-cols-1 gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptSelect(prompt)}
                  className="text-left bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-blue-500 rounded-lg p-3 transition-all group"
                >
                  <p className="text-sm text-gray-300 group-hover:text-white">{prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Or write your own prompt:
            </label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Ask Astra to create a visualization from your data..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {errorMessage && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-300">{errorMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateVisualization}
              disabled={isGenerating || !userPrompt.trim()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Generate Visualization</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Your visualization will appear in the main chat. You can always ask Astra to create more visualizations anytime!
          </p>
        </div>
      </div>
    </div>
  );
};
