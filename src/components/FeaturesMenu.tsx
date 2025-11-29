import React, { useState, useRef, useEffect } from 'react';
import { Plus, BookOpen, MessageCircleQuestion, Sparkles, Workflow, Zap, Rocket, Home } from 'lucide-react';

interface FeaturesMenuProps {
  onOpenSetupGuide?: () => void;
  onStartTour?: () => void;
  onOpenHelpCenter?: (tab: string) => void;
  hasN8NAccess?: boolean;
}

export function FeaturesMenu({ onOpenSetupGuide, onStartTour, onOpenHelpCenter, hasN8NAccess = false }: FeaturesMenuProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="p-2 hover:bg-slate-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation group relative"
        aria-label="Features"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity"></div>
        <div className="relative">
          <Plus className="w-7 h-7 text-blue-400 relative z-10 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] animate-pulse" />
          <Plus className="w-7 h-7 text-purple-400 absolute top-0 left-0 opacity-50 blur-sm" />
        </div>
        <Sparkles className="w-3 h-3 text-purple-400 absolute top-1.5 right-1.5 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </button>

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50"
        >
          <a
            href="/"
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
            onClick={() => setIsDropdownOpen(false)}
          >
            <Home className="w-4 h-4 text-blue-400" />
            <span>Home</span>
          </a>
          {hasN8NAccess && (
            <a
              href="/build-agents"
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
              onClick={() => setIsDropdownOpen(false)}
            >
              <Workflow className="w-4 h-4 text-purple-400" />
              <span>Build Agents</span>
            </a>
          )}
          <div className="border-t border-gray-700 my-2"></div>
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onOpenSetupGuide?.();
            }}
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
          >
            <Rocket className="w-4 h-4 text-purple-400" />
            <span>Launch Guided Setup</span>
          </button>
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onStartTour?.();
            }}
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Take Tour Again</span>
          </button>
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onOpenHelpCenter?.('whats-new');
            }}
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
          >
            <Zap className="w-4 h-4 text-orange-400" />
            <span>What's New</span>
          </button>
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onOpenHelpCenter?.('quick-start');
            }}
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Quick Start Guide</span>
          </button>
          <button
            onClick={() => {
              setIsDropdownOpen(false);
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
  );
}
