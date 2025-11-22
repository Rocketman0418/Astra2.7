import React, { useState } from 'react';
import { FileText, ExternalLink, Upload, Sparkles } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';
import { StrategyDocumentModal } from '../StrategyDocumentModal';

interface PlaceFilesStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
  folderData: any;
}

type ViewMode = 'choose-option' | 'waiting-for-files' | 'document-created';

export const PlaceFilesStep: React.FC<PlaceFilesStepProps> = ({ onComplete, folderData }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('choose-option');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [createdDocumentId, setCreatedDocumentId] = useState('');

  const handleHasFiles = () => {
    setViewMode('waiting-for-files');
  };

  const handleCreateStrategyDocument = () => {
    setShowDocumentModal(true);
  };

  const handleDocumentCreated = (documentId: string) => {
    setCreatedDocumentId(documentId);
    setShowDocumentModal(false);
    setViewMode('document-created');
  };

  const handleProceedToSync = () => {
    onComplete();
  };

  const openGoogleDrive = () => {
    if (folderData?.selectedFolder?.id) {
      window.open(`https://drive.google.com/drive/folders/${folderData.selectedFolder.id}`, '_blank');
    } else {
      window.open('https://drive.google.com', '_blank');
    }
  };

  // Initial view - Choose between two options
  if (viewMode === 'choose-option') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-600/20 mb-3">
            <Upload className="w-7 h-7 text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Place Your Files</h2>
          <p className="text-sm text-gray-300">
            Add at least one document to your folder, then return here to proceed
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleHasFiles}
            className="bg-purple-900/20 hover:bg-purple-800/30 border-2 border-purple-700 hover:border-purple-500 rounded-lg p-4 transition-all group min-h-[140px] flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1 text-center">
              I have files to put in my folder
            </h3>
            <p className="text-xs text-gray-400 text-center">
              I'll place my existing strategy documents in the folder
            </p>
          </button>

          <button
            onClick={handleCreateStrategyDocument}
            className="bg-blue-900/20 hover:bg-blue-800/30 border-2 border-blue-700 hover:border-blue-500 rounded-lg p-4 transition-all group min-h-[140px] flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1 text-center">
              Help me create my first file
            </h3>
            <p className="text-xs text-gray-400 text-center">
              Let Astra help you create a strategy document
            </p>
          </button>
        </div>

        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
          <h4 className="text-white text-xs font-medium mb-2">💡 What are Strategy Documents?</h4>
          <p className="text-xs text-blue-300 mb-2">
            Documents that help Astra understand your team's direction:
          </p>
          <ul className="text-xs text-blue-300 space-y-1 list-disc list-inside">
            <li>Mission and vision statements</li>
            <li>Core values and principles</li>
            <li>Goals and objectives (1-year, 3-year)</li>
            <li>Strategic plans and roadmaps</li>
          </ul>
        </div>

        {showDocumentModal && (
          <StrategyDocumentModal
            isOpen={showDocumentModal}
            onClose={() => setShowDocumentModal(false)}
            folderId={folderData?.selectedFolder?.id || ''}
            onSuccess={handleDocumentCreated}
          />
        )}
      </div>
    );
  }

  // View for waiting for user to place files
  if (viewMode === 'waiting-for-files') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-600/20 mb-3">
            <Upload className="w-7 h-7 text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Place Your Files</h2>
          <p className="text-sm text-gray-300">
            Add at least one document to your folder, then return here to proceed
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-yellow-400" />
            Instructions:
          </h3>
          <ol className="space-y-2 text-xs text-gray-300">
            <li className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-600/20 flex items-center justify-center text-xs text-yellow-400 font-medium">
                1
              </span>
              <span>Click the button below to open your Google Drive folder in a new window</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-600/20 flex items-center justify-center text-xs text-yellow-400 font-medium">
                2
              </span>
              <span>Upload or move at least one strategy document into the folder</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-600/20 flex items-center justify-center text-xs text-yellow-400 font-medium">
                3
              </span>
              <span>Return to this page and click "Proceed to Sync" to continue</span>
            </li>
          </ol>
        </div>

        <div className="bg-gray-800 rounded-lg p-3">
          <h4 className="text-white text-xs font-medium mb-1">Supported File Types:</h4>
          <p className="text-xs text-gray-400">
            Google Docs, PDFs, Word documents (.docx), text files (.txt), and more
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            onClick={openGoogleDrive}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <span>Open Google Drive</span>
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={handleProceedToSync}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <span>Proceed to Sync →</span>
          </button>
        </div>
      </div>
    );
  }

  // View after strategy document has been created
  if (viewMode === 'document-created') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-600/20 mb-3">
            <FileText className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Strategy Document Created!</h2>
          <p className="text-sm text-gray-300">
            Your strategy document has been successfully created and saved to your folder
          </p>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <h3 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-400" />
            What's Next?
          </h3>
          <p className="text-xs text-green-300 mb-2">
            Your strategy document is ready to be synced with Astra. Once synced, Astra will be able to:
          </p>
          <ul className="space-y-1 text-xs text-green-300">
            <li className="flex items-start space-x-2">
              <span className="text-green-400">✓</span>
              <span>Answer questions about your team's mission and goals</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400">✓</span>
              <span>Provide insights aligned with your strategic direction</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400">✓</span>
              <span>Help your team stay focused on core objectives</span>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={openGoogleDrive}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 min-h-[44px]"
          >
            <span>View Document</span>
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={handleProceedToSync}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all flex items-center space-x-2 min-h-[44px]"
          >
            <span>Proceed to Sync →</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
