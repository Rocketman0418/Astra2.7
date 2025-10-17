import React from 'react';
import { X, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GmailSettings } from './GmailSettings';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">User Settings</h2>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center space-x-3 mb-2">
              <UserIcon className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Profile Information</h3>
            </div>
            <div className="space-y-2 ml-8">
              <div>
                <p className="text-sm text-gray-400">Full Name</p>
                <p className="text-white">{user?.user_metadata?.full_name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">{user?.email}</p>
              </div>
            </div>
          </div>

          <GmailSettings />
        </div>
      </div>
    </div>
  );
};
