import React, { useState, useRef } from 'react';
import { ArrowLeft, Plus, Check, Download } from 'lucide-react';
import { exportVisualizationToPDF } from '../utils/exportVisualizationToPDF';
import { useAuth } from '../contexts/AuthContext';

interface VisualizationViewProps {
  content: string;
  onBack: () => void;
  onSave?: () => Promise<void>;
  isSaved?: boolean;
  title?: string;
  backButtonText?: string;
}

export const VisualizationView: React.FC<VisualizationViewProps> = ({
  content,
  onBack,
  onSave,
  isSaved = false,
  title = 'Visualization',
  backButtonText = 'Go Back to Chat'
}) => {
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const visualizationRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const handleSave = async () => {
    if (!onSave || isSaved) return;

    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!visualizationRef.current) return;

    setExporting(true);
    try {
      const styleTag = document.createElement('style');
      styleTag.textContent = `
        * {
          word-spacing: normal !important;
          letter-spacing: normal !important;
        }
        h1, h2, h3, h4, h5, h6 {
          word-spacing: 0.25rem !important;
          letter-spacing: 0.02em !important;
        }
      `;

      const tempContainer = document.createElement('div');
      tempContainer.appendChild(styleTag);

      const contentClone = visualizationRef.current.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(contentClone);

      tempContainer.style.cssText = 'position: absolute; left: -9999px; top: 0;';
      document.body.appendChild(tempContainer);

      await new Promise(resolve => setTimeout(resolve, 300));

      await exportVisualizationToPDF(tempContainer, {
        filename: title,
        title: title,
        userName: user?.email?.split('@')[0] || 'User'
      });

      document.body.removeChild(tempContainer);
    } catch (error: any) {
      alert(error.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
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
              {backButtonText}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors min-h-[44px] touch-manipulation bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              <span className="font-semibold">{exporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>

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
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 bg-gray-800">
        <div
          ref={visualizationRef}
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};