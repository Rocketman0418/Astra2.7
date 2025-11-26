import { useState, useEffect } from 'react';
import { FolderInfo } from '../lib/google-drive-oauth';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { GoogleDriveFolderPicker } from './GoogleDriveFolderPicker';
import { Search, FolderOpen, CheckCircle } from 'lucide-react';

interface FolderSelectionWrapperProps {
  accessToken: string;
  folderType: 'meetings' | 'strategy' | 'financial';
  folders: FolderInfo[]; // For legacy mode
  currentFolder: FolderInfo | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFolderSelect: (folder: FolderInfo | null) => void;
  onCreateNew?: () => void;
  allowCreateNew?: boolean;
}

/**
 * Wrapper component that shows either:
 * - Google Picker (for beta users)
 * - Legacy dropdown (for regular users)
 */
export const FolderSelectionWrapper = ({
  accessToken,
  folderType,
  folders,
  currentFolder,
  searchTerm,
  onSearchChange,
  onFolderSelect,
  onCreateNew,
  allowCreateNew = false
}: FolderSelectionWrapperProps) => {
  const useGooglePicker = useFeatureFlag('google_picker_folder_selection');

  // Google Picker Mode
  if (useGooglePicker) {
    return (
      <GoogleDriveFolderPicker
        accessToken={accessToken}
        folderType={folderType}
        currentFolder={currentFolder}
        onFolderSelected={onFolderSelect}
        onCreateNew={onCreateNew}
        allowCreateNew={allowCreateNew}
      />
    );
  }

  // Legacy Dropdown Mode
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-200">
        {folderType.charAt(0).toUpperCase() + folderType.slice(1)} Folder
      </label>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search folders..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
        />
      </div>

      {/* Folder List */}
      <div className="max-h-48 overflow-y-auto bg-gray-700/30 border border-gray-600 rounded-lg">
        <button
          onClick={() => onFolderSelect(null)}
          className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
            !currentFolder
              ? 'bg-blue-600/30 text-blue-200 border-l-4 border-blue-500 font-semibold'
              : 'text-gray-400 hover:bg-gray-700/50'
          }`}
        >
          <span>-- No folder selected --</span>
          {!currentFolder && <CheckCircle className="w-4 h-4 text-blue-400" />}
        </button>
        {filteredFolders.map(folder => (
          <button
            key={folder.id}
            onClick={() => onFolderSelect(folder)}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-t border-gray-600/50 flex items-center justify-between ${
              currentFolder?.id === folder.id
                ? 'bg-blue-600/30 text-blue-200 border-l-4 border-blue-500 font-semibold'
                : 'text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="flex items-center">
              <FolderOpen className="w-4 h-4 inline mr-2" />
              {folder.name}
            </span>
            {currentFolder?.id === folder.id && <CheckCircle className="w-4 h-4 text-blue-400" />}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Folder containing your {folderType} documents
      </p>

      {/* Create New Button (Strategy only) */}
      {allowCreateNew && onCreateNew && (
        <button
          onClick={onCreateNew}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="text-sm text-white">
            Create Astra {folderType.charAt(0).toUpperCase() + folderType.slice(1)} Folder
          </span>
        </button>
      )}
    </div>
  );
};
