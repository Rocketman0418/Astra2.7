import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, Plus, BookOpen, MessageCircleQuestion, Sparkles, Workflow, Zap, Rocket } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ChatMode } from '../types';
import { NotificationBell } from './NotificationBell';
import { UserSettingsModal } from './UserSettingsModal';
import { useUserProfile } from '../hooks/useUserProfile';
import { SupportMenu } from './SupportMenu';
import { InstallAppButton } from './InstallAppButton';
import { HelpCenterTab } from './HelpCenter';

interface HeaderProps {
  onToggleSidebar: () => void;
  showSidebarToggle?: boolean;
  chatMode?: ChatMode;
  onToggleTeamMenu?: () => void;
  onOpenHelpCenter?: (tab?: HelpCenterTab) => void;
  onStartTour?: () => void;
  onOpenSetupGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  showSidebarToggle = true,
  chatMode = 'private',
  onToggleTeamMenu,
  onOpenHelpCenter,
  onStartTour,
  onOpenSetupGuide
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [showSettings, setShowSettings] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [hasN8NAccess, setHasN8NAccess] = useState(false);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkN8NAccess = async () => {
      if (!user) {
        setHasN8NAccess(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('n8n_user_access')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_enabled', true)
          .maybeSingle();

        if (error) {
          console.error('Error checking N8N access:', error);
          setHasN8NAccess(false);
          return;
        }

        console.log('N8N Access Check:', { userId: user.id, hasAccess: !!data, data });
        setHasN8NAccess(!!data);
      } catch (err) {
        console.error('Exception checking N8N access:', err);
        setHasN8NAccess(false);
      }
    };

    checkN8NAccess();

    // Set up realtime subscription for access changes
    const channel = supabase
      .channel('n8n_access_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'n8n_user_access',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('N8N access changed:', payload);
          checkN8NAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpMenuRef.current && !helpMenuRef.current.contains(event.target as Node)) {
        setShowHelpMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#1e293b] shadow-lg px-4 h-16">
      <div className="flex items-center justify-between h-full py-1">
        {/* Left side - Menu button and branding */}
        <div className="flex items-center space-x-3">
          {showSidebarToggle && (
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Team chat menu */}
          {chatMode === 'team' && (
            <button
              onClick={onToggleTeamMenu}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Logo and title */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* AI Rocket Logo */}
            <div className="flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full bg-blue-400 shadow-lg flex-shrink-0">
              <span className="text-lg md:text-2xl">🚀</span>
            </div>

            {/* Brand Title - Responsive */}
            <h1 className="text-sm md:text-2xl font-bold tracking-tight flex items-center gap-1 md:gap-3">
              {/* Mobile: Show shortened version */}
              <span className="md:hidden text-blue-400">AI Rocket</span>
              <span className="md:hidden text-white font-normal">+</span>
              <span className="md:hidden text-emerald-400">Astra</span>

              {/* Desktop: Show full title */}
              <span className="hidden md:inline text-blue-400">AI Rocket</span>
              <span className="hidden md:inline text-white font-normal">+</span>
              <span className="hidden md:inline text-emerald-400">Astra Intelligence</span>
            </h1>
          </div>
        </div>

        {/* Right side - User info */}
        <div className="flex items-center space-x-2">
          <InstallAppButton />
          <NotificationBell onOpenSettings={() => setShowSettings(true)} />

          {/* Help Menu */}
          <div className="relative" ref={helpMenuRef}>
            <button
              onClick={() => setShowHelpMenu(!showHelpMenu)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation group relative"
              aria-label="Help"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative">
                <Plus className="w-7 h-7 text-blue-400 relative z-10 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] animate-pulse" />
                <Plus className="w-7 h-7 text-purple-400 absolute top-0 left-0 opacity-50 blur-sm" />
              </div>
              <Sparkles className="w-3 h-3 text-purple-400 absolute top-1.5 right-1.5 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </button>

            {showHelpMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                {hasN8NAccess && (
                  <>
                    <a
                      href="/build-agents"
                      className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                      onClick={() => setShowHelpMenu(false)}
                    >
                      <Workflow className="w-4 h-4 text-purple-400" />
                      <span>Build Agents</span>
                    </a>
                    <div className="border-t border-gray-700 my-2"></div>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowHelpMenu(false);
                    onOpenSetupGuide?.();
                  }}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <Rocket className="w-4 h-4 text-purple-400" />
                  <span>Launch Guided Setup</span>
                </button>
                <button
                  onClick={() => {
                    setShowHelpMenu(false);
                    onStartTour?.();
                  }}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>Take Tour Again</span>
                </button>
                <button
                  onClick={() => {
                    setShowHelpMenu(false);
                    onOpenHelpCenter?.('whats-new');
                  }}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span>What's New</span>
                </button>
                <button
                  onClick={() => {
                    setShowHelpMenu(false);
                    onOpenHelpCenter?.('quick-start');
                  }}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Quick Start Guide</span>
                </button>
                <button
                  onClick={() => {
                    setShowHelpMenu(false);
                    onOpenHelpCenter?.('faq');
                  }}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <MessageCircleQuestion className="w-4 h-4 text-green-400" />
                  <span>FAQ & Ask Astra</span>
                </button>
              </div>
            )}
          </div>

          {/* Support Menu */}
          <SupportMenu />

          <button
            data-tour="user-menu"
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