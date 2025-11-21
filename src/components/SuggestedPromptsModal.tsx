import React from 'react';
import { X, Sparkles, Send } from 'lucide-react';

interface SuggestedPrompt {
  title: string;
  prompt: string;
  description: string;
}

interface SuggestedPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    title: "Get Expert Prompts",
    prompt: "Acting as an expert prompt engineer, please provide a list of 10 useful prompts that I can submit in order to gain the most value from Astra Intelligence",
    description: "Unlock Astra's full potential by getting expert-crafted prompts that leverage all data sources and capabilities."
  },
  {
    title: "Mission Alignment Analysis",
    prompt: "Summarize our mission, core values, and goals, then analyze how well our recent activities align with them",
    description: "Gets foundational company direction and immediately provides an alignment check against current work."
  },
  {
    title: "Leadership Meeting Insights",
    prompt: "Summarize my last 4 leadership meetings and identify key trends, insights, and recommendations for improvement",
    description: "Goes beyond basic summaries to extract patterns and actionable intelligence from meeting history."
  },
  {
    title: "Team Alignment Assessment",
    prompt: "Analyze our recent meetings and assess how well the team is staying aligned with our mission, core values, and goals",
    description: "Provides strategic oversight by connecting day-to-day discussions to long-term company direction."
  },
  {
    title: "Financial Analysis",
    prompt: "Summarize our financials, then generate a cash flow and burn rate analysis with projections",
    description: "Delivers comprehensive financial intelligence in one query - current state plus forward-looking analysis."
  },
  {
    title: "Strategic Financial Review",
    prompt: "Review our financial data and evaluate how our spending and resource allocation aligns with our mission, core values, and strategic goals",
    description: "Connects financial decisions to strategic priorities, ensuring money flows toward what matters most."
  }
];

export const SuggestedPromptsModal: React.FC<SuggestedPromptsModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt
}) => {
  if (!isOpen) return null;

  const handleSelectPrompt = (prompt: string) => {
    onSelectPrompt(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 via-green-500 to-blue-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Suggested Prompts</h2>
              <p className="text-sm text-gray-400">Get the most out of Astra Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <div className="space-y-3">
            {SUGGESTED_PROMPTS.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSelectPrompt(item.prompt)}
                className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-blue-500 transition-all group"
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <Send className="w-4 h-4 text-blue-400 flex-shrink-0 ml-2 mt-0.5" />
                </div>
                <p className="text-xs text-gray-300 mb-2 italic line-clamp-2">
                  "{item.prompt}"
                </p>
                <p className="text-xs text-gray-400 line-clamp-2">
                  <span className="font-medium text-gray-300">Why it's valuable:</span> {item.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
