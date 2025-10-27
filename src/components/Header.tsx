import React, { useState } from 'react';
import { Menu, User, MessageSquare, Users, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChatMode } from '../types';
import { NotificationBell } from './NotificationBell';
import { UserSettingsModal } from './UserSettingsModal';
import { useUserProfile } from '../hooks/useUserProfile';

interface HeaderProps {
  onToggleSidebar: () => void;
  showSidebarToggle?: boolean;
  chatMode?: ChatMode;
  onToggleTeamMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  showSidebarToggle = true,
  chatMode = 'private',
  onToggleTeamMenu
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg px-4 h-16">
      <div className="flex items-center justify-between h-full py-1">
        {/* Left side - Menu button and branding */}
        <div className="flex items-center space-x-3">
          {showSidebarToggle && (
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-purple-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Team chat menu */}
          {chatMode === 'team' && (
            <button
              onClick={onToggleTeamMenu}
              className="p-2 hover:bg-purple-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Logo and title */}
          <div className="flex items-center space-x-3">
            {/* AI Rocket Logo */}
            <div className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-blue-400 shadow-lg">
              <span className="text-xl md:text-2xl">🚀</span>
            </div>

            {/* Brand Title */}
            <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-blue-400">AI Rocket</span>
              <span className="text-white font-normal">+</span>
              <span className="text-emerald-400">Astra Intelligence</span>
            </h1>
          </div>
        </div>

        {/* Right side - User info */}
        <div className="flex items-center space-x-2">
          <NotificationBell onOpenSettings={() => setShowSettings(true)} />
          <div className="hidden sm:block text-right">
            <p className="text-white text-sm font-medium">
              {profile?.full_name || user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-blue-200 text-xs">
              {user?.email}
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:ring-2 hover:ring-white/30 transition-all cursor-pointer overflow-hidden"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-blue-800 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      <UserSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </header>
  );
};