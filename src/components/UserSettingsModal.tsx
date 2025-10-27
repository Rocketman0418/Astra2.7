import React, { useState, useRef } from 'react';
import { X, User as UserIcon, Save, UserPlus, LogOut, Key, Camera, Trash2, Upload, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GmailSettings } from './GmailSettings';
import { useUserProfile } from '../hooks/useUserProfile';
import { supabase } from '../lib/supabase';
import { AdminInviteCodesPanel } from './AdminInviteCodesPanel';
import { TeamMembersPanel } from './TeamMembersPanel';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
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

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [viewFinancial, setViewFinancial] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [showInviteMessage, setShowInviteMessage] = useState(false);

  const isAdmin = user?.user_metadata?.role === 'admin';
  const teamName = user?.user_metadata?.team_name || 'your team';

  React.useEffect(() => {
    if (profile) {
      setName(profile.name || '');
    }
  }, [profile]);

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

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleInviteTeamMember = async () => {
    if (!inviteEmail) {
      setInviteError('Email is required');
      return;
    }

    if (!isAdmin) {
      setInviteError('Only admins can invite team members');
      return;
    }

    setInviting(true);
    setInviteError('');
    setInviteSuccess('');
    setShowInviteMessage(false);

    try {
      const teamId = user?.user_metadata?.team_id;
      if (!teamId) {
        setInviteError('No team found. Please complete onboarding first.');
        setInviting(false);
        return;
      }

      const inviteCode = generateInviteCode();

      const { error } = await supabase
        .from('invite_codes')
        .insert({
          code: inviteCode,
          team_id: teamId,
          invited_email: inviteEmail.toLowerCase().trim(),
          assigned_role: inviteRole,
          view_financial: viewFinancial,
          created_by: user.id,
          max_uses: 1,
          is_active: true
        });

      if (error) throw error;

      setGeneratedCode(inviteCode);
      setShowInviteMessage(true);
      setInviteSuccess(`Invite code generated for ${inviteEmail}`);
    } catch (err: any) {
      console.error('Error creating invite:', err);
      setInviteError(err.message || 'Failed to create invite');
    } finally {
      setInviting(false);
    }
  };

  const copyInviteMessage = () => {
    const message = `You've been invited to join ${user?.user_metadata?.team_name || 'our team'} on Astra Intelligence!

Use this invite code to create your account: ${generatedCode}
Email: ${inviteEmail}

Sign up here: ${window.location.origin}`;

    navigator.clipboard.writeText(message);
    setInviteSuccess('Invite message copied to clipboard!');
  };

  const resetInviteForm = () => {
    setInviteEmail('');
    setInviteRole('member');
    setViewFinancial(true);
    setGeneratedCode('');
    setShowInviteMessage(false);
    setInviteError('');
    setInviteSuccess('');
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

          <GmailSettings />

          {isAdmin && (
            <TeamMembersPanel />
          )}

          {isAdmin && (
            <AdminInviteCodesPanel />
          )}

          {isAdmin && (
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center space-x-3 mb-6">
                <UserPlus className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Invite Team Member</h3>
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

              {!showInviteMessage ? (
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
                    <label className="text-sm text-gray-400 mb-1 block">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                      disabled={inviting}
                      className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {inviteRole === 'admin'
                        ? 'Admins can invite team members and manage team settings'
                        : 'Members have limited permissions'}
                    </p>
                  </div>

                  {inviteRole === 'member' && (
                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-600">
                      <div>
                        <p className="text-white text-sm font-medium">View Financial Information</p>
                        <p className="text-xs text-gray-500 mt-1">Allow access to financial data and documents</p>
                      </div>
                      <button
                        onClick={() => setViewFinancial(!viewFinancial)}
                        disabled={inviting}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          viewFinancial ? 'bg-green-600' : 'bg-gray-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            viewFinancial ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleInviteTeamMember}
                    disabled={inviting || !inviteEmail}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {inviting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Generating Invite...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Generate Invite Code</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                    <p className="text-green-400 text-sm font-medium mb-3">Invite Code Generated!</p>
                    <div className="bg-gray-900 rounded p-3 mb-3">
                      <p className="text-white text-xs mb-2 font-mono">
                        You've been invited to join {user?.user_metadata?.team_name || 'our team'} on Astra Intelligence!
                      </p>
                      <p className="text-white text-xs mb-2">
                        Use this invite code to create your account: <span className="font-bold text-green-400">{generatedCode}</span>
                      </p>
                      <p className="text-white text-xs mb-2">
                        Email: <span className="font-bold">{inviteEmail}</span>
                      </p>
                      <p className="text-white text-xs">
                        Sign up here: <span className="text-blue-400">{window.location.origin}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyInviteMessage}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Key className="w-4 h-4" />
                        <span>Copy Invite Message</span>
                      </button>
                      <button
                        onClick={resetInviteForm}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-400 text-sm font-medium mb-2">Next Steps:</p>
                    <ul className="text-gray-400 text-xs space-y-1">
                      <li>• Copy the invite message above</li>
                      <li>• Send it to {inviteEmail} via email or message</li>
                      <li>• They'll use the code and their email to sign up</li>
                      <li>• They'll automatically join your team with the assigned role</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
