import React, { useState } from 'react';
import { Plus, Settings, Trash2, Eye, FileText, Maximize2, RotateCcw } from 'lucide-react';
import { useReportsContext } from '../contexts/ReportsContext';
import { ManageReportsModal } from './ManageReportsModal';
import { VisualizationView } from './VisualizationView';

export const ReportsView: React.FC = () => {
  const {
    reportMessages,
    loading,
    error,
    deleteReportMessage,
    setError,
    runReportNow,
    runningReports
  } = useReportsContext();

  const [showManageModal, setShowManageModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState<{
    messageId: string;
    content: string;
  } | null>(null);
  const [expandedTextId, setExpandedTextId] = useState<string | null>(null);
  const [retryingReportId, setRetryingReportId] = useState<string | null>(null);

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

  const handleViewText = (messageId: string) => {
    setExpandedTextId(expandedTextId === messageId ? null : messageId);
  };

  const handleRetry = async (messageId: string) => {
    const message = reportMessages.find(m => m.id === messageId);
    if (!message || !message.reportMetadata?.reportId) {
      console.error('Cannot retry: missing report metadata');
      return;
    }

    setRetryingReportId(messageId);
    try {
      await runReportNow(message.reportMetadata.reportId);
    } catch (err) {
      console.error('Failed to retry report:', err);
    } finally {
      setRetryingReportId(null);
    }
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
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Report</span>
            </button>
            <button
              onClick={() => setShowManageModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors min-h-[44px]"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Reports</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-400">
          AI-powered reports and visualizations delivered automatically.
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

      {/* Content - Single Column Stack */}
      <div className="flex-1 overflow-y-auto p-4">
        {reportMessages.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {reportMessages.map((message) => (
              <div
                key={message.id}
                className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Header with timestamp and delete */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      🚀
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">
                        {message.timestamp.toLocaleDateString()} at{' '}
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {message.reportMetadata?.title && (
                        <p className="text-sm text-white font-medium">
                          {message.reportMetadata.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRetry(message.id)}
                      disabled={retryingReportId === message.id || runningReports.has(message.reportMetadata?.reportId)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm min-h-[44px]"
                      title="Retry visualization"
                    >
                      {(retryingReportId === message.id || runningReports.has(message.reportMetadata?.reportId)) ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          <span>Retrying...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Visualization Preview (scrollable) */}
                {message.visualization && message.visualization_data ? (
                  <div className="relative">
                    <div className="h-96 overflow-y-auto bg-gray-900">
                      <iframe
                        srcDoc={message.visualization_data}
                        className="w-full min-h-full"
                        sandbox="allow-scripts"
                        style={{ border: 'none' }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
                  </div>
                ) : (
                  <div className="h-64 bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-600 text-5xl mb-2">📊</div>
                      <p className="text-gray-500 text-sm">No visualization available</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="p-4 border-t border-gray-700 flex flex-wrap gap-2">
                  {message.visualization && message.visualization_data && (
                    <button
                      onClick={() => handleViewVisualization(message.id, message.visualization_data!)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm min-h-[44px]"
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span>Full View</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleViewText(message.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm min-h-[44px]"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{expandedTextId === message.id ? 'Hide Text' : 'View Text'}</span>
                  </button>
                </div>

                {/* Expanded Text View */}
                {expandedTextId === message.id && (
                  <div className="px-4 pb-4">
                    <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {message.text}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Reports Yet
            </h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Create your first report to get AI-powered insights and visualizations delivered automatically.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors min-h-[44px]"
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

      {/* Manage Reports Modal - shows active reports for edit/delete/run */}
      {showManageModal && (
        <ManageReportsModal
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
        />
      )}

      {/* Create New Report Modal - shows templates and custom option */}
      {showCreateModal && (
        <ManageReportsModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};
