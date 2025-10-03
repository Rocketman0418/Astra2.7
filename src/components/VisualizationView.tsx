import React, { useState } from 'react';
import { ArrowLeft, Plus, Check } from 'lucide-react';

interface VisualizationViewProps {
  content: string;
  onBack: () => void;
  onSave?: () => Promise<void>;
  isSaved?: boolean;
}

export const VisualizationView: React.FC<VisualizationViewProps> = ({
  content,
  onBack,
  onSave,
  isSaved = false
}) => {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave || isSaved) return;

    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      <header className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg">
        <div className="flex items-center justify-between py-4 px-6">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 hover:bg-blue-700 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">
              Go Back to Chat
            </h1>
          </div>

          {onSave && (
            <button
              onClick={handleSave}
              disabled={saving || isSaved}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors min-h-[44px] touch-manipulation ${
                isSaved
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-gradient-to-r from-blue-700 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900'
              } disabled:opacity-50`}
            >
              {isSaved ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Saved</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">{saving ? 'Saving...' : 'My Visualizations'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 bg-gray-800">
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {onSave && (
          <div className="flex justify-center mt-6 pb-6">
            <button
              onClick={handleSave}
              disabled={saving || isSaved}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors min-h-[44px] touch-manipulation ${
                isSaved
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-gradient-to-r from-blue-700 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900'
              } disabled:opacity-50`}
            >
              {isSaved ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Saved</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">{saving ? 'Saving...' : 'My Visualizations'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};