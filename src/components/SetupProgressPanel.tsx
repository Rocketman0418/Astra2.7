import React from 'react';
import { CheckCircle, XCircle, Circle, TrendingUp, Users, Clock } from 'lucide-react';

interface SetupProgressData {
  user_id: string;
  user_email: string;
  team_name: string;
  current_step: number;
  is_completed: boolean;
  is_skipped: boolean;
  started_at: string;
  completed_at: string | null;
  last_updated_at: string;
  steps_completed: number;
  step_1_onboarding_completed: boolean;
  step_2_google_drive_connected: boolean;
  step_3_folder_selected_or_created: boolean;
  step_4_files_placed_in_folder: boolean;
  step_5_data_synced: boolean;
  step_6_team_settings_configured: boolean;
  step_7_first_prompt_sent: boolean;
  step_8_visualization_created: boolean;
  step_9_manual_report_run: boolean;
  step_10_scheduled_report_created: boolean;
  step_11_team_members_invited: boolean;
}

interface SetupProgressPanelProps {
  progressData: SetupProgressData[];
  loading?: boolean;
}

const STEP_NAMES = [
  'Onboarding',
  'Google Drive Connected',
  'Folder Selected/Created',
  'Files Placed in Folder',
  'Data Synced',
  'Team Settings Configured',
  'First Prompt Sent',
  'Visualization Created',
  'Manual Report Run',
  'Scheduled Report Created',
  'Team Members Invited',
];

export const SetupProgressPanel: React.FC<SetupProgressPanelProps> = ({ progressData, loading }) => {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-400">Loading setup progress...</p>
      </div>
    );
  }

  const totalUsers = progressData.length;
  const completedSetups = progressData.filter(p => p.is_completed).length;
  const inProgressSetups = totalUsers - completedSetups;

  const completionRate = totalUsers > 0 ? (completedSetups / totalUsers) * 100 : 0;

  const stepDistribution = STEP_NAMES.map((name, index) => {
    const stepNum = index + 1;
    const usersOnThisStep = progressData.filter(p => p.current_step === stepNum && !p.is_completed).length;
    return { name, step: stepNum, count: usersOnThisStep };
  });

  const stepCompletionCounts = STEP_NAMES.map((name, index) => {
    const stepKey = `step_${index + 1}_${name.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_or_')}` as keyof SetupProgressData;
    const completedCount = progressData.filter(p => p[stepKey] === true).length;
    return { name, count: completedCount, percentage: totalUsers > 0 ? (completedCount / totalUsers) * 100 : 0 };
  });

  const avgStepsCompleted = totalUsers > 0
    ? progressData.reduce((sum, p) => sum + p.steps_completed, 0) / totalUsers
    : 0;

  const avgDaysToComplete = completedSetups > 0
    ? progressData
        .filter(p => p.is_completed && p.completed_at)
        .reduce((sum, p) => {
          const days = (new Date(p.completed_at!).getTime() - new Date(p.started_at).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / completedSetups
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-white">{totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-white">{completedSetups}</p>
              <p className="text-xs text-green-400">{completionRate.toFixed(1)}% completion rate</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">In Progress</p>
              <p className="text-3xl font-bold text-white">{inProgressSetups}</p>
              <p className="text-xs text-yellow-400">Avg {avgStepsCompleted.toFixed(1)} steps done</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Average Time to Complete */}
      {completedSetups > 0 && (
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-sm text-gray-400">Average Time to Complete Setup</p>
              <p className="text-2xl font-bold text-white">{avgDaysToComplete.toFixed(1)} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Step Distribution */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Users by Current Step
        </h3>
        <div className="space-y-3">
          {stepDistribution.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-400 flex-shrink-0">
                Step {item.step}: {item.name}
              </div>
              <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-center text-xs font-medium text-white transition-all"
                  style={{ width: `${totalUsers > 0 ? (item.count / totalUsers) * 100 : 0}%`, minWidth: item.count > 0 ? '30px' : '0' }}
                >
                  {item.count > 0 && item.count}
                </div>
              </div>
              <div className="w-16 text-sm text-gray-300 text-right">
                {totalUsers > 0 ? ((item.count / totalUsers) * 100).toFixed(1) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Completion Rate */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Step Completion Rates (All Users)
        </h3>
        <div className="space-y-3">
          {stepCompletionCounts.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-400 flex-shrink-0">
                {item.name}
              </div>
              <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full flex items-center justify-center text-xs font-medium text-white transition-all"
                  style={{ width: `${item.percentage}%`, minWidth: item.count > 0 ? '30px' : '0' }}
                >
                  {item.count > 0 && item.count}
                </div>
              </div>
              <div className="w-20 text-sm text-gray-300 text-right">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Details Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">User Progress Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Current Step</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Progress</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {progressData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No setup progress data available
                  </td>
                </tr>
              ) : (
                progressData.map((user) => {
                  const progressPercentage = (user.steps_completed / 11) * 100;
                  return (
                    <tr key={user.user_id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{user.user_email}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                          Step {user.current_step} / 11
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden max-w-[120px]">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{user.steps_completed}/11</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.is_completed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                            <Circle className="w-3 h-3" />
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(user.last_updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
