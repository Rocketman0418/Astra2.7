import React, { useState, useRef } from 'react';
import { X, User as UserIcon, Camera, Trash2, Upload, Save, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GmailSettings } from './GmailSettings';
import { useUserProfile } from '../hooks/useUserProfile';
import { supabase } from '../lib/supabase';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { profile, loading, uploadAvatar, deleteAvatar, updateProfile } = useUserProfile();
  const [fullName, setFullName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  const isAdmin = user?.email === 'clay@rockethub.ai';

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  if (!isOpen) return null;

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

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSavingName(true);
    setError('');

    const result = await updateProfile({ full_name: fullName.trim() });
    setSavingName(false);

    if (result.success) {
      setIsEditingName(false);
    } else {
      setError(result.error || 'Failed to update name');
    }
  };

  const handleCancelEdit = () => {
    setFullName(profile?.full_name || '');
    setIsEditingName(false);
    setError('');
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !invitePassword) {
      setInviteError('Email and password are required');
      return;
    }

    setInviting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setInviteError('Not authenticated');
        setInviting(false);
        return;
      }

      console.log('[Invite] Sending request with token:', session.access_token.substring(0, 20) + '...');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          password: invitePassword,
        }),
      });

      console.log('[Invite] Response status:', response.status);
      const result = await response.json();
      console.log('[Invite] Response body:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to invite user');
      }

      setInviteSuccess(`Successfully created account for ${inviteEmail}`);
      setInviteEmail('');
      setInvitePassword('');
    } catch (err: any) {
      console.error('Error inviting user:', err);
      setInviteError(err.message || 'Failed to invite user');
    } finally {
      setInviting(false);
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
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center space-x-3 mb-6">
              <UserIcon className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Profile Information</h3>
            </div>

            <div className="space-y-6">
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
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
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
                        <p className="text-white">{profile?.full_name || 'Not set'}</p>
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
                </div>
              </div>
            </div>
          </div>

          <GmailSettings />

          {isAdmin && (
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center space-x-3 mb-6">
                <UserPlus className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Admin: Invite New User</h3>
              </div>

              {inviteSuccess && (
                <div className="mb-4 bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                  <p className="text-green-400 text-sm">{inviteSuccess}</p>
                </div>
              )}

              {inviteError && (
                <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{inviteError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={inviting}
                    className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Password</label>
                  <input
                    type="password"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="Set initial password"
                    disabled={inviting}
                    className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">User will be able to change this password after first login</p>
                </div>

                <button
                  onClick={handleInviteUser}
                  disabled={inviting || !inviteEmail || !invitePassword}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {inviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create User Account</span>
                    </>
                  )}
                </button>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-400 text-sm font-medium mb-2">How it works:</p>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>• Account is created immediately with the specified email and password</li>
                    <li>• Email is automatically confirmed (no verification email sent)</li>
                    <li>• User can log in immediately using the provided credentials</li>
                    <li>• User can change their password after logging in</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
