import React, { useState } from 'react';
import { X, HelpCircle, Rocket } from 'lucide-react';

interface LaunchPreparationHeaderProps {
  onClose: () => void;
  onHelp?: () => void;
}

export const LaunchPreparationHeader: React.FC<LaunchPreparationHeaderProps> = ({
  onClose,
  onHelp
}) => {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleClose = () => {
    setShowCloseConfirm(true);
  };

  const confirmClose = () => {
    onClose();
  };

  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 via-green-500 to-blue-500 rounded-lg">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                Mission Control
              </h1>
              <p className="text-xs text-gray-400 leading-tight">
                Launch Preparation
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {onHelp && (
              <button
                onClick={onHelp}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Save and Exit"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">
              Exit Launch Preparation?
            </h3>
            <p className="text-gray-300 mb-6">
              Your progress has been saved. You can return anytime to continue your launch preparation.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelClose}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Continue Setup
              </button>
              <button
                onClick={confirmClose}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 via-green-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
