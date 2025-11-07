import React, { useState, useRef } from 'react';
import { X, User as UserIcon, Save, LogOut, Key, Camera, Trash2, Upload, Settings, Mail, Clock, HardDrive } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GmailSettings } from './GmailSettings';
import { GoogleDriveSettings } from './GoogleDriveSettings';
import { useUserProfile } from '../hooks/useUserProfile';
import { supabase } from '../lib/supabase';
import { AdminInviteCodesPanel } from './AdminInviteCodesPanel';
import { TeamMembersPanel } from './TeamMembersPanel';
import { TeamSettingsModal } from './TeamSettingsModal';
import { FEATURES } from '../config/features';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshSession } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar, deleteAvatar } = useUserProfile();
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  const [teamName, setTeamName] = useState<string>('');
  const [needsSessionRefresh, setNeedsSessionRefresh] = useState(false);
  const [refreshingSession, setRefreshingSession] = useState(false);
  const [dbTeamId, setDbTeamId] = useState<string | null>(null);

  const isAdmin = user?.user_metadata?.role === 'admin';
  const teamId = user?.user_metadata?.team_id;

  React.useEffect(() => {
    if (profile) {
      setName(profile.name || '');
    }
  }, [profile]);

  React.useEffect(() => {
    if (teamId) {
      loadTeamName();
    }
  }, [teamId]);

  React.useEffect(() => {
    checkSessionSync();
  }, [user?.id]);

  const checkSessionSync = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setDbTeamId(data.team_id);
        const sessionTeamId = user.user_metadata?.team_id;
        if (data.team_id !== sessionTeamId) {
          setNeedsSessionRefresh(true);
        }
      }
    } catch (err) {
      console.error('Error checking session sync:', err);
    }
  };

  const handleRefreshSession = async () => {
    setRefreshingSession(true);
    try {
      await refreshSession();
      setNeedsSessionRefresh(false);
      window.location.reload();
    } catch (err) {
      console.error('Error refreshing session:', err);
    } finally {
      setRefreshingSession(false);
    }
  };

  const loadTeamName = async () => {
    if (!teamId && !dbTeamId) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId || dbTeamId)
        .maybeSingle();

      if (error) {
        console.error('Error loading team name:', error);
        return;
      }

      if (data) {
        setTeamName(data.name);
      }
    } catch (err) {
      console.error('Error loading team name:', err);
    }
  };

  if (!isOpen) return null;


  const handleSaveName = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSavingName(true);
    setError('');

    const result = await updateProfile({ name: name.trim() });
    setSavingName(false);

    if (result.success) {
      setIsEditingName(false);
    } else {
      setError(result.error || 'Failed to update name');
    }
  };

  const handleCancelEdit = () => {
    setName(profile?.name || '');
    setIsEditingName(false);
    setError('');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    setUploading(true);
    setError('');

    const result = await uploadAvatar(file);
    setUploading(false);

    if (!result.success) {
      setError(result.error || 'Failed to upload avatar');
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to delete your avatar?')) return;

    setUploading(true);
    const result = await deleteAvatar();
    setUploading(false);

    if (!result.success) {
      setError(result.error || 'Failed to delete avatar');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setPasswordError('Both password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
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
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {needsSessionRefresh && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-blue-300 font-medium text-sm mb-1">Session Update Required</p>
                  <p className="text-blue-200/80 text-xs">
                    Your account information has been updated. Please refresh your session to see the latest changes.
                  </p>
                </div>
                <button
                  onClick={handleRefreshSession}
                  disabled={refreshingSession}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center space-x-2 flex-shrink-0"
                >
                  {refreshingSession ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <span>Refresh Now</span>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center space-x-3 mb-6">
              <UserIcon className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Profile Information</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="relative group">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-white" />
                      </div>
                    )}

                    <button
                      onClick={handleAvatarClick}
                      disabled={uploading || loading}
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleAvatarClick}
                      disabled={uploading || loading}
                      className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center justify-center space-x-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                    {profile?.avatar_url && (
                      <button
                        onClick={handleDeleteAvatar}
                        disabled={uploading || loading}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Full Name</label>
                    {isEditingName ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveName}
                            disabled={savingName}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
                          >
                            {savingName ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={savingName}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-white">{profile?.name || 'Not set'}</p>
                        <button
                          onClick={() => setIsEditingName(true)}
                          disabled={loading}
                          className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Email</label>
                    <p className="text-white">{user?.email}</p>
                  </div>

                  {teamName && (
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Team</label>
                      <p className="text-white">{teamName}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-600">
                    {!isChangingPassword ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsChangingPassword(true);
                            setPasswordError('');
                            setPasswordSuccess('');
                          }}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <Key className="w-4 h-4" />
                          <span>Change Password</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to log out?')) {
                              await supabase.auth.signOut();
                              onClose();
                            }
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {passwordSuccess && (
                          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                            <p className="text-green-400 text-sm">{passwordSuccess}</p>
                          </div>
                        )}

                        {passwordError && (
                          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                            <p className="text-red-400 text-sm">{passwordError}</p>
                          </div>
                        )}

                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min 6 characters)"
                            disabled={changingPassword}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">Confirm New Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            disabled={changingPassword}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleChangePassword}
                            disabled={changingPassword || !newPassword || !confirmPassword}
                            className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                          >
                            {changingPassword ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Update Password</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setIsChangingPassword(false);
                              setNewPassword('');
                              setConfirmPassword('');
                              setPasswordError('');
                              setPasswordSuccess('');
                            }}
                            disabled={changingPassword}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {FEATURES.GOOGLE_DRIVE_SYNC_ENABLED ? (
            <GoogleDriveSettings />
          ) : (
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <HardDrive className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-white">Google Drive Sync</h3>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
                    Coming Soon
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Connect your Google Drive to automatically sync and vectorize documents from your Meeting Recordings and Strategy Documents folders.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>This feature is currently being enhanced and will be available soon.</span>
              </div>
            </div>
          )}

          {FEATURES.GMAIL_ENABLED ? (
            <GmailSettings />
          ) : (
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-white">Gmail Integration</h3>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
                    Coming Soon
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Connect your Gmail account to enable AI-powered email insights and vectorization.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>This feature is currently being enhanced and will be available soon.</span>
              </div>
            </div>
          )}

          {isAdmin && teamId && (
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Team Settings</h3>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Configure meeting types and news preferences for your team.
              </p>
              <button
                onClick={() => setShowTeamSettings(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Manage Team Settings</span>
              </button>
            </div>
          )}

          {teamId && (
            <TeamMembersPanel />
          )}

          {isAdmin && (
            <AdminInviteCodesPanel />
          )}
        </div>
      </div>

      {isAdmin && teamId && (
        <TeamSettingsModal
          isOpen={showTeamSettings}
          onClose={() => setShowTeamSettings(false)}
          teamId={teamId}
          isOnboarding={false}
        />
      )}
    </div>
  );
};
