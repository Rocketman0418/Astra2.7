import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ScheduledReportStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
}

export const ScheduledReportStep: React.FC<ScheduledReportStepProps> = ({ onComplete, progress }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scheduledReportsCount, setScheduledReportsCount] = useState(0);

  useEffect(() => {
    checkScheduledReports();
  }, [user]);

  const checkScheduledReports = async () => {
    if (!user) return;
    const teamId = user.user_metadata?.team_id;
    if (teamId) {
      // Get all users in the same team
      const { data: teamUsers } = await supabase
        .from('users')
        .select('id')
        .eq('team_id', teamId);

      if (teamUsers && teamUsers.length > 0) {
        const teamUserIds = teamUsers.map(u => u.id);

        // Count scheduled reports for all team members
        const { count } = await supabase
          .from('astra_reports')
          .select('id', { count: 'exact', head: true })
          .in('user_id', teamUserIds)
          .eq('schedule_type', 'scheduled')
          .eq('is_active', true);

        setScheduledReportsCount(count || 0);
      }
    }
    setLoading(false);
  };

  const hasScheduledReports = progress?.step_10_scheduled_report_created || scheduledReportsCount > 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
            <Calendar className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Schedule Reports</h2>
          <p className="text-gray-300">Checking your scheduled reports...</p>
        </div>
      </div>
    );
  }

  if (hasScheduledReports) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
            <CheckCircle className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Scheduled Reports Active!</h2>
          <p className="text-gray-300">You have {scheduledReportsCount} active scheduled report{scheduledReportsCount !== 1 ? 's' : ''}.</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Active Reports</h3>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{scheduledReportsCount} Scheduled Report{scheduledReportsCount !== 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-400 mt-1">Reports will be generated and delivered automatically</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <p className="text-sm text-green-300">
            <span className="font-medium">✅ Excellent!</span> Your reports will be generated automatically on schedule.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-orange-500 via-green-500 to-blue-500 hover:from-orange-600 hover:via-green-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all min-h-[44px]">
            Complete Setup! 🎉
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
          <Calendar className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Schedule Automatic Reports</h2>
        <p className="text-gray-300">Get regular insights delivered automatically</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Scheduled Report Benefits:</h3>
        <div className="space-y-3">
          {['Daily, weekly, or monthly reports', 'Automatic email delivery', 'Consistent insights without manual effort', 'Track trends over time'].map((item, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
        <p className="text-sm text-purple-300">
          <span className="font-medium">💡 Tip:</span> Set up scheduled reports from the Reports view to stay updated automatically.
        </p>
      </div>

      <div className="flex justify-center pt-4">
        <button onClick={onComplete} className="px-8 py-3 bg-gradient-to-r from-orange-500 via-green-500 to-blue-500 hover:from-orange-600 hover:via-green-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all min-h-[44px]">
          Complete Setup! 🎉
        </button>
      </div>
    </div>
  );
};
