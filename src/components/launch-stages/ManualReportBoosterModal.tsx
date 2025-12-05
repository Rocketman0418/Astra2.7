import React, { useState } from 'react';
import { X, FileBarChart, Send, Sparkles, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ManualReportBoosterModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export const ManualReportBoosterModal: React.FC<ManualReportBoosterModalProps> = ({ onClose, onComplete }) => {
  const { user } = useAuth();
  const [reportTitle, setReportTitle] = useState('');
  const [reportPrompt, setReportPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const suggestedReports = [
    {
      title: 'Weekly Strategy Summary',
      prompt: 'Analyze my strategy documents and provide a comprehensive summary of key initiatives, priorities, and action items for this week'
    },
    {
      title: 'Meeting Action Items Report',
      prompt: 'Review all recent meetings and compile a list of action items, decisions made, and follow-up tasks organized by priority'
    },
    {
      title: 'Project Status Overview',
      prompt: 'Provide an overview of all current projects, their status, key milestones, and any blockers or risks identified'
    },
    {
      title: 'Financial Performance Summary',
      prompt: 'Analyze financial documents and create a summary of key metrics, trends, and insights for the current period'
    }
  ];

  const handleReportSelect = (report: typeof suggestedReports[0]) => {
    setReportTitle(report.title);
    setReportPrompt(report.prompt);
  };

  const handleGenerateReport = async () => {
    if (!reportTitle.trim() || !reportPrompt.trim()) {
      setErrorMessage('Please provide both a title and prompt for your report');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');

    try {
      // Create the manual report
      const { error: reportError } = await supabase
        .from('user_reports')
        .insert({
          user_id: user?.id,
          title: reportTitle,
          prompt: reportPrompt,
          schedule_frequency: 'manual',
          is_active: true,
          metadata: { from_launch_prep: true }
        });

      if (reportError) throw reportError;

      // Save a chat message to trigger report generation
      const { error: chatError } = await supabase
        .from('astra_chats')
        .insert({
          user_id: user?.id,
          message: `Generate report: ${reportTitle} - ${reportPrompt}`,
          mode: 'reports',
          context_type: 'manual_report',
          metadata: { from_launch_prep: true }
        });

      if (chatError) throw chatError;

      // Complete the achievement
      await onComplete();
    } catch (error) {
      console.error('Error generating report:', error);
      setErrorMessage('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <FileBarChart className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Manual Reports</h2>
              <p className="text-sm text-gray-400">Generate on-demand insights</p>
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
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-300 font-medium mb-1">
                  Generate Comprehensive Reports On-Demand
                </p>
                <p className="text-sm text-gray-300">
                  Create detailed reports from your data whenever you need them. Perfect for stakeholder updates, decision-making, and deep analysis of specific topics.
                </p>
              </div>
            </div>
          </div>

          {/* Suggested Reports */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Try These Report Templates:</h3>
            <div className="space-y-2">
              {suggestedReports.map((report, index) => (
                <button
                  key={index}
                  onClick={() => handleReportSelect(report)}
                  className="w-full text-left bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-green-500 rounded-lg p-3 transition-all group"
                >
                  <p className="text-sm font-medium text-white mb-1">{report.title}</p>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300">{report.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Report Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Report Title
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g., Weekly Executive Summary"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                What would you like in this report?
              </label>
              <textarea
                value={reportPrompt}
                onChange={(e) => setReportPrompt(e.target.value)}
                placeholder="Describe what you want Astra to analyze and include in your report..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={4}
              />
            </div>
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
              onClick={handleGenerateReport}
              disabled={isGenerating || !reportTitle.trim() || !reportPrompt.trim()}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Your report will be generated and available in the Reports section. You can create more reports anytime!
          </p>
        </div>
      </div>
    </div>
  );
};
