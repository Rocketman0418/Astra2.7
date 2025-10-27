import React, { useState } from 'react';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { useReportsContext } from '../contexts/ReportsContext';
import { ManageReportsModal } from './ManageReportsModal';
import { VisualizationView } from './VisualizationView';

export const ReportsView: React.FC = () => {
  const {
    reportMessages,
    loading,
    error,
    deleteReportMessage,
    setError
  } = useReportsContext();

  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState<{
    messageId: string;
    content: string;
  } | null>(null);

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Delete this report?')) {
      await deleteReportMessage(messageId);
    }
  };

  const handleViewVisualization = (messageId: string, visualizationData: string) => {
    setSelectedVisualization({
      messageId,
      content: visualizationData
    });
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
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors min-h-[44px]"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Reports</span>
          </button>
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

      {/* Content - Grid of Visualizations */}
      <div className="flex-1 overflow-y-auto p-4">
        {reportMessages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportMessages.map((message) => (
              <div
                key={message.id}
                className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => message.visualization_data && handleViewVisualization(message.id, message.visualization_data)}
              >
                {/* Visualization Preview */}
                {message.visualization && message.visualization_data ? (
                  <div className="relative h-48 bg-gray-900 overflow-hidden">
                    <iframe
                      srcDoc={message.visualization_data}
                      className="w-full h-full pointer-events-none"
                      sandbox="allow-scripts"
                      style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent pointer-events-none"></div>
                  </div>
                ) : (
                  <div className="h-48 bg-gray-900 flex items-center justify-center">
                    <div className="text-gray-600 text-5xl">📊</div>
                  </div>
                )}

                {/* Report Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">
                        {message.timestamp.toLocaleDateString()} at{' '}
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {message.text.substring(0, 100)}
                        {message.text.length > 100 && '...'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMessage(message.id);
                      }}
                      className="ml-2 text-gray-400 hover:text-red-400 transition-colors p-2"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
              onClick={() => setShowManageModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors min-h-[44px]"
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
