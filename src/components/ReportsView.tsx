import React, { useState } from 'react';
import { Plus, Play, Settings, Trash2, Clock, Calendar, BarChart3 } from 'lucide-react';
import { useReportsContext } from '../contexts/ReportsContext';
import { ManageReportsModal } from './ManageReportsModal';
import { VisualizationView } from './VisualizationView';

export const ReportsView: React.FC = () => {
  const {
    userReports,
    reportMessages,
    loading,
    error,
    runningReports,
    runReportNow,
    deleteReportMessage,
    setError
  } = useReportsContext();

  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState<{
    messageId: string;
    content: string;
  } | null>(null);

  const handleRunReport = async (reportId: string) => {
    try {
      await runReportNow(reportId);
    } catch (err: any) {
      console.error('Failed to run report:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Delete this report result?')) {
      await deleteReportMessage(messageId);
    }
  };

  const handleViewVisualization = (messageId: string, visualizationData: string) => {
    setSelectedVisualization({
      messageId,
      content: visualizationData
    });
  };

  const getScheduleDisplay = (report: any) => {
    if (report.schedule_type === 'manual') {
      return 'Manual';
    }

    const freq = report.schedule_frequency;
    const time = report.schedule_time || '09:00';

    if (freq === 'daily') {
      return `Daily at ${time}`;
    } else if (freq === 'weekly') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = days[report.schedule_day || 1];
      return `Weekly on ${dayName} at ${time}`;
    } else if (freq === 'monthly') {
      return `Monthly on day ${report.schedule_day || 1} at ${time}`;
    }

    return 'Not scheduled';
  };

  if (selectedVisualization) {
    return (
      <VisualizationView
        visualizationHtml={selectedVisualization.content}
        onClose={() => setSelectedVisualization(null)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Reports</h2>
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Reports</span>
          </button>
        </div>
        <p className="text-sm text-gray-400">
          Schedule AI-powered reports to run automatically and deliver insights.
        </p>
      </div>

      {error && (
        <div className="mx-4 mt-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Active Reports Section */}
        {userReports.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Your Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{report.title}</h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {report.prompt}
                      </p>
                    </div>
                    {report.is_active && (
                      <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{getScheduleDisplay(report)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunReport(report.id)}
                    disabled={runningReports.has(report.id)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                  >
                    {runningReports.has(report.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Run Now</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Results Section */}
        {reportMessages.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Recent Results</h3>
            <div className="space-y-3">
              {reportMessages.map((message) => (
                <div
                  key={message.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        🚀
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">
                          {message.timestamp.toLocaleDateString()} at{' '}
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete result"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-sm text-gray-300 whitespace-pre-wrap mb-3">
                    {message.text.substring(0, 300)}
                    {message.text.length > 300 && '...'}
                  </div>

                  {message.visualization && message.visualization_data && (
                    <button
                      onClick={() =>
                        handleViewVisualization(message.id, message.visualization_data!)
                      }
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>View Visualization</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {userReports.length === 0 && reportMessages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Reports Yet
            </h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Create your first report to get AI-powered insights delivered automatically.
            </p>
            <button
              onClick={() => setShowManageModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Report</span>
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Manage Reports Modal */}
      {showManageModal && (
        <ManageReportsModal onClose={() => setShowManageModal(false)} />
      )}
    </div>
  );
};
