import React from 'react';
import { BarChart3, CheckCircle } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';

interface VisualizationStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

export const VisualizationStep: React.FC<VisualizationStepProps> = ({ onComplete, progress }) => {
  const hasCreatedVisualization = progress?.step_8_visualization_created || false;

  if (hasCreatedVisualization) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
            <CheckCircle className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Visualization Created!</h2>
          <p className="text-gray-300">You've successfully generated an AI-powered visualization.</p>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <p className="text-sm text-green-300">
            <span className="font-medium">✅ Excellent!</span> You can create unlimited visualizations to explore your data.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]">
            Next: Team Settings →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
          <BarChart3 className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Try Visualizations</h2>
        <p className="text-gray-300">Generate visual insights from your data</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How to Create a Visualization:</h3>
        <ol className="space-y-3 text-gray-300 list-decimal list-inside">
          <li>Ask Astra a question about your data</li>
          <li>Click the "Generate Visualization" button</li>
          <li>Astra will create an interactive chart or graph</li>
          <li>Save or export your visualization</li>
        </ol>
      </div>

      <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
        <p className="text-sm text-purple-300">
          <span className="font-medium">💡 Examples:</span> "Show me meeting frequency over time" or "Visualize our strategic priorities"
        </p>
      </div>

      <div className="flex justify-center pt-4">
        <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]">
          Continue →
        </button>
      </div>
    </div>
  );
};
