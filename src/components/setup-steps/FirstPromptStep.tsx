import React from 'react';
import { MessageSquare, CheckCircle } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';

interface FirstPromptStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

export const FirstPromptStep: React.FC<FirstPromptStepProps> = ({ onComplete, progress }) => {
  const hasAskedQuestion = progress?.step_7_first_prompt_sent || false;

  if (hasAskedQuestion) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 mb-4">
            <CheckCircle className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">First Question Complete!</h2>
          <p className="text-gray-300">You've successfully asked Astra a question and received an AI response.</p>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <p className="text-sm text-green-300">
            <span className="font-medium">✅ Great start!</span> You're now ready to explore more advanced features.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]">
            Next: Try Visualizations →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 mb-4">
          <MessageSquare className="w-8 h-8 text-blue-400" />
          </div>
        <h2 className="text-2xl font-bold text-white mb-3">Ask Your First Question</h2>
        <p className="text-gray-300">Try asking Astra about your data</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Example Questions:</h3>
        <div className="space-y-2 text-gray-300">
          {['What were the key decisions from our last strategy meeting?', 'Summarize our financial performance this quarter', 'What are the main action items from recent meetings?'].map((q, idx) => (
            <div key={idx} className="p-3 bg-gray-900/50 rounded-lg text-sm">💬 {q}</div>
          ))}
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <span className="font-medium">💡 Tip:</span> Close this guide and use the chat to ask a question. You can return here anytime.
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
