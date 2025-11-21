import React from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';

interface ManualReportStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

export const ManualReportStep: React.FC<ManualReportStepProps> = ({ onComplete, progress }) => {
  const hasCreatedReport = progress?.step_9_manual_report_run || false;

  if (hasCreatedReport) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600/20 mb-4">
            <CheckCircle className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Manual Report Created!</h2>
          <p className="text-gray-300">You've successfully generated a custom report.</p>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <p className="text-sm text-green-300">
            <span className="font-medium">✅ Perfect!</span> You can create custom reports anytime from the Reports view.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]">
            Next: Schedule Reports →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600/20 mb-4">
          <FileText className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Create a Manual Report</h2>
        <p className="text-gray-300">Generate custom reports from your data</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Report Features:</h3>
        <div className="space-y-3">
          {['Generate reports on demand', 'Customizable prompts and formats', 'Export as PDF or share with team', 'Save report templates for reuse'].map((item, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
        <p className="text-sm text-orange-300">
          <span className="font-medium">💡 Tip:</span> Access the Reports view from the navigation menu to create your first report.
        </p>
      </div>

      <div className="flex justify-center pt-4">
        <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all min-h-[44px]">
          Skip for Now →
        </button>
      </div>
    </div>
  );
};
