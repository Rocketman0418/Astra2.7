import React, { useState } from 'react';
import { FileText, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { SetupGuideProgress } from '../../lib/setup-guide-utils';
import { StrategyDocumentModal } from '../StrategyDocumentModal';

interface PlaceFilesStepProps {
  onComplete: () => void;
  progress: SetupGuideProgress | null;
  folderData: any;
}

type ViewMode = 'initial-existing' | 'initial-new' | 'waiting-for-files' | 'creating-document' | 'document-created';

export const PlaceFilesStep: React.FC<PlaceFilesStepProps> = ({ onComplete, folderData }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Determine initial view based on folder data from previous step
    if (folderData?.isNewFolder) {
      return 'initial-new';
    } else if (folderData?.existingFolder || folderData?.selectedFolder) {
      return 'initial-existing';
    }
    return 'initial-existing';
  });

  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [createdDocumentId, setCreatedDocumentId] = useState('');

  const handleHasFiles = () => {
    // User confirms they have files in existing folder
    onComplete();
  };

  const handleNeedToPlaceFiles = () => {
    // User needs to place files in existing folder
    setViewMode('waiting-for-files');
  };

  const handleHasFilesForNewFolder = () => {
    // User has files to place in new Astra Strategy folder
    setViewMode('waiting-for-files');
  };

  const handleCreateStrategyDocument = () => {
    // User wants Astra to create strategy document
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

  // View for users who selected an existing folder
  if (viewMode === 'initial-existing') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4">
            <FileText className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Do you have files in this folder?</h2>
          <p className="text-gray-300">
            Let us know if your selected folder already contains strategy documents
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-white font-medium mb-3">📁 Selected Folder:</h3>
          <div className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-purple-400" />
              <span className="text-white font-medium">
                {folderData?.selectedFolder?.name || 'Strategy Folder'}
              </span>
            </div>
            <button
              onClick={openGoogleDrive}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <span>Open</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleHasFiles}
            className="bg-green-900/20 hover:bg-green-800/30 border-2 border-green-700 hover:border-green-500 rounded-lg p-6 transition-all group min-h-[160px] flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 text-center">
              Yes, I have files
            </h3>
            <p className="text-sm text-gray-400 text-center">
              My folder already contains strategy documents
            </p>
          </button>

          <button
            onClick={handleNeedToPlaceFiles}
            className="bg-blue-900/20 hover:bg-blue-800/30 border-2 border-blue-700 hover:border-blue-500 rounded-lg p-6 transition-all group min-h-[160px] flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 text-center">
              No, I need to add files
            </h3>
            <p className="text-sm text-gray-400 text-center">
              I'll place documents in the folder first
            </p>
          </button>
        </div>
      </div>
    );
  }

  // View for users who created a new "Astra Strategy" folder
  if (viewMode === 'initial-new') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4">
            <FileText className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Add Strategy Documents</h2>
          <p className="text-gray-300">
            Choose how you'd like to populate your Astra Strategy folder
          </p>
        </div>

        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">💡 What are Strategy Documents?</h4>
          <p className="text-sm text-blue-300 mb-2">
            Documents that help Astra understand your team's direction:
          </p>
          <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
            <li>Mission and vision statements</li>
            <li>Core values and principles</li>
            <li>Goals and objectives (1-year, 3-year)</li>
            <li>Strategic plans and roadmaps</li>
            <li>Product information and positioning</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleHasFilesForNewFolder}
            className="bg-purple-900/20 hover:bg-purple-800/30 border-2 border-purple-700 hover:border-purple-500 rounded-lg p-6 transition-all group min-h-[180px] flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 text-center">
              I have files to upload
            </h3>
            <p className="text-sm text-gray-400 text-center">
              I'll place my existing strategy documents in the folder
            </p>
          </button>

          <button
            onClick={handleCreateStrategyDocument}
            className="bg-blue-900/20 hover:bg-blue-800/30 border-2 border-blue-700 hover:border-blue-500 rounded-lg p-6 transition-all group min-h-[180px] flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 text-center">
              Create Strategy Document
            </h3>
            <p className="text-sm text-gray-400 text-center">
              Let Astra help you create a strategy document
            </p>
          </button>
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
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-600/20 mb-4">
            <Upload className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Place Your Files</h2>
          <p className="text-gray-300">
            Add at least one document to your folder, then return here to proceed
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-400" />
            Instructions:
          </h3>
          <ol className="space-y-3 text-gray-300">
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600/20 flex items-center justify-center text-sm text-yellow-400 font-medium">
                1
              </span>
              <span>Click the button below to open your Google Drive folder in a new window</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600/20 flex items-center justify-center text-sm text-yellow-400 font-medium">
                2
              </span>
              <span>Upload or move at least one strategy document into the folder</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600/20 flex items-center justify-center text-sm text-yellow-400 font-medium">
                3
              </span>
              <span>Return to this page and click "Proceed to Sync" to continue</span>
            </li>
          </ol>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2 text-sm">Supported File Types:</h4>
          <p className="text-sm text-gray-400">
            Google Docs, PDFs, Word documents (.docx), text files (.txt), and more
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={openGoogleDrive}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <span>Open Google Drive</span>
            <ExternalLink className="w-5 h-5" />
          </button>
          <button
            onClick={handleProceedToSync}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2 min-h-[44px]"
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
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4 animate-bounce">
            <FileText className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Strategy Document Created!</h2>
          <p className="text-gray-300">
            Your strategy document has been successfully created and saved to your folder
          </p>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" />
            What's Next?
          </h3>
          <p className="text-green-300 text-sm mb-3">
            Your strategy document is ready to be synced with Astra. Once synced, Astra will be able to:
          </p>
          <ul className="space-y-2 text-sm text-green-300">
            <li className="flex items-start space-x-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>Answer questions about your team's mission and goals</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>Provide insights aligned with your strategic direction</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>Help your team stay focused on core objectives</span>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={openGoogleDrive}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 min-h-[44px]"
          >
            <span>View Document</span>
            <ExternalLink className="w-5 h-5" />
          </button>
          <button
            onClick={handleProceedToSync}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center space-x-2 min-h-[44px]"
          >
            <span>Proceed to Sync →</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
