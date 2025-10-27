import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Plus, Search, X, LogOut, User, Bookmark, Mail } from 'lucide-react';
import { useChats, Conversation } from '../hooks/useChats';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (conversationId: string) => void;
  onStartNewConversation: () => void;
  activeConversationId: string | null;
  onOpenSavedVisualizations?: () => void;
  onOpenUserSettings?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  onLoadConversation,
  onStartNewConversation,
  activeConversationId,
  onOpenSavedVisualizations,
  onOpenUserSettings
}) => {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const {
    conversations,
    deleteConversation,
    loading,
    fetchConversations
  } = useChats();

  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Refresh conversations when activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      console.log('🔄 ChatSidebar: activeConversationId changed, refreshing conversations');
      fetchConversations();
    }
  }, [activeConversationId, fetchConversations]);

  // Set up dedicated realtime subscription for sidebar
  useEffect(() => {
    if (!user) return;

    console.log('📡 ChatSidebar: Setting up realtime subscription for astra_chats');

    const channel = supabase
      .channel('sidebar_astra_chats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'astra_chats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 ChatSidebar: New message detected, refreshing conversations');
          // Small delay to ensure DB transaction is fully committed
          setTimeout(() => fetchConversations(), 200);
        }
      )
      .subscribe();

    return () => {
      console.log('📡 ChatSidebar: Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  console.log('🚀 ChatSidebar render:', {
    isOpen,
    activeConversationId,
    conversationsCount: conversations.length,
    conversationIds: conversations.map(c => c.id)
  });

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewChat = () => {
    onStartNewConversation();
    onClose();
  };

  const handleLoadConversation = (conversationId: string) => {
    console.log('ChatSidebar: Loading conversation', conversationId);
    onLoadConversation(conversationId);
    onClose();
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(conversationId);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gray-800 border-r border-gray-700 z-50 transform transition-transform duration-300 ease-in-out pt-16 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🚀</span>
                <h2 className="text-lg font-bold text-white">Chat History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>

            {/* Email Integration Button */}
            {onOpenUserSettings && (
              <button
                onClick={() => {
                  onOpenUserSettings();
                  onClose();
                }}
                className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 min-h-[44px]"
              >
                <Mail className="w-4 h-4" />
                <span>+ Email</span>
              </button>
            )}

            {/* My Visualizations Button */}
            {onOpenSavedVisualizations && (
              <button
                onClick={() => {
                  onOpenSavedVisualizations();
                  onClose();
                }}
                className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 min-h-[44px]"
              >
                <Bookmark className="w-4 h-4" />
                <span>+ My Visualizations</span>
              </button>
            )}

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
                <p className="text-gray-400 text-sm mt-2">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  {searchTerm ? 'No conversations found' : 'No conversations yet'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {searchTerm ? 'Try a different search term' : 'Start a new chat to begin'}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredConversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  console.log('🎯 Chat item render:', {
                    conversationId: conversation.id,
                    activeConversationId: activeConversationId,
                    isActive: isActive,
                    idsMatch: conversation.id === activeConversationId,
                    title: conversation.title.substring(0, 30)
                  });

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => handleLoadConversation(conversation.id)}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 ${
                        isActive
                          ? 'bg-gray-700 border-l-4 border-blue-500'
                          : 'bg-gray-800 border-l-4 border-transparent hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm truncate mb-1 ${
                            isActive ? 'text-blue-300 font-semibold' : 'text-white font-medium'
                          }`}>
                            {conversation.title}
                          </h3>
                          <p className={`text-xs line-clamp-2 mb-2 ${
                            isActive ? 'text-gray-300' : 'text-gray-400'
                          }`}>
                            {conversation.lastMessage}
                          </p>
                          <div className={`flex items-center justify-between text-xs ${
                            isActive ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <span>{formatDate(conversation.createdAt)}</span>
                            <span>{conversation.messageCount} messages</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteConversation(e, conversation.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all duration-200 ml-2"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-700">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center space-x-3 p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium truncate">
                    {profile?.full_name || user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {user?.email}
                  </p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-700 rounded-lg shadow-lg border border-gray-600 overflow-hidden z-60">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 p-3 hover:bg-gray-600 transition-colors text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};