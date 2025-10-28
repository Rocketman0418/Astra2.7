import React, { useState, useEffect } from 'react';
import { Users, Shield, Edit2, Trash2, Save, X, UserPlus, Key, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'member';
  view_financial: boolean;
  avatar_url: string | null;
}

export const TeamMembersPanel: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'member'>('member');
  const [editViewFinancial, setEditViewFinancial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<{ role: string; team_id: string | null } | null>(null);

  // Add member states
  const [showAddMember, setShowAddMember] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [viewFinancial, setViewFinancial] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [showInviteMessage, setShowInviteMessage] = useState(false);

  const isAdmin = currentUserData?.role === 'admin';
  const teamId = currentUserData?.team_id;

  // Fetch current user's data from public.users table
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('users')
        .select('role, team_id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current user data:', error);
        return;
      }

      setCurrentUserData(data);
    };

    fetchCurrentUser();
  }, [user?.id]);

  useEffect(() => {
    if (isAdmin && teamId) {
      loadTeamMembers();
    }
  }, [isAdmin, teamId]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      setError('');

      // Query the public.users table for team members
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, role, view_financial, avatar_url, team_id')
        .eq('team_id', teamId);

      if (usersError) throw usersError;

      const teamMembers = (usersData || [])
        .map((u) => ({
          id: u.id,
          email: u.email || '',
          full_name: u.name || null,
          role: (u.role || 'member') as 'admin' | 'member',
          view_financial: u.view_financial !== false,
          avatar_url: u.avatar_url || null,
        }))
        .sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          return a.email.localeCompare(b.email);
        });

      setMembers(teamMembers);
    } catch (err: any) {
      console.error('Error loading team members:', err);
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (member: TeamMember) => {
    setEditingMember(member.id);
    setEditRole(member.role);
    setEditViewFinancial(member.view_financial);
  };

  const cancelEditing = () => {
    setEditingMember(null);
    setEditRole('member');
    setEditViewFinancial(true);
  };

  const saveChanges = async (memberId: string) => {
    try {
      setSaving(true);
      setError('');

      // Update the public.users table
      // The trigger will automatically sync to auth.users.raw_user_meta_data
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: editRole,
          view_financial: editViewFinancial,
        })
        .eq('id', memberId);

      if (updateError) throw updateError;

      await loadTeamMembers();
      setEditingMember(null);
    } catch (err: any) {
      console.error('Error updating member:', err);
      setError(err.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team? They will lose access to all team data.`)) {
      return;
    }

    try {
      setError('');

      // Remove user from team by setting team_id to null
      // The trigger will sync this to auth metadata
      const { error: updateError } = await supabase
        .from('users')
        .update({
          team_id: null,
          role: null,
          view_financial: false,
        })
        .eq('id', memberId);

      if (updateError) throw updateError;

      await loadTeamMembers();
    } catch (err: any) {
      console.error('Error removing member:', err);
      setError(err.message || 'Failed to remove member');
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

    setInviting(true);
    setInviteError('');
    setInviteSuccess('');
    setShowInviteMessage(false);

    try {
      if (!teamId) {
        setInviteError('No team found.');
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
          created_by: user?.id,
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
    setShowAddMember(false);
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Team Members</h3>
          <span className="text-sm text-gray-400">({members.length})</span>
        </div>
        <button
          onClick={() => setShowAddMember(!showAddMember)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAddMember ? 'Cancel' : 'Add Member'}</span>
        </button>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200 space-y-2">
            <p className="font-medium">Understanding Roles & Permissions</p>
            <ul className="space-y-1 text-xs text-blue-300">
              <li><strong>Admin:</strong> Can invite team members, manage roles, and access all features including financial data.</li>
              <li><strong>Member:</strong> Standard access with optional financial data viewing permissions.</li>
              <li><strong>View Financials:</strong> When enabled for members, allows access to financial documents and data.</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {members.map((member) => {
          const isEditing = editingMember === member.id;
          const isCurrentUser = member.id === user?.id;

          return (
            <div
              key={member.id}
              className="bg-gray-900 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name || member.email}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(member.full_name || member.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-medium">
                        {member.full_name || 'No name set'}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{member.email}</p>
                  </div>
                </div>

                {!isEditing ? (
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Shield
                          className={`w-4 h-4 ${
                            member.role === 'admin' ? 'text-yellow-400' : 'text-gray-400'
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            member.role === 'admin' ? 'text-yellow-400' : 'text-gray-400'
                          }`}
                        >
                          {member.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      </div>
                      {member.role === 'member' && (
                        <p className="text-xs text-gray-500">
                          {member.view_financial ? 'Financial: Yes' : 'Financial: No'}
                        </p>
                      )}
                    </div>

                    {!isCurrentUser && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditing(member)}
                          className="p-2 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => removeMember(member.id, member.email)}
                          className="p-2 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col space-y-2">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as 'admin' | 'member')}
                        disabled={saving}
                        className="px-3 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>

                      {editRole === 'member' && (
                        <label className="flex items-center space-x-2 text-xs text-gray-400">
                          <input
                            type="checkbox"
                            checked={editViewFinancial}
                            onChange={(e) => setEditViewFinancial(e.target.checked)}
                            disabled={saving}
                            className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span>View Financial</span>
                        </label>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => saveChanges(member.id)}
                        disabled={saving}
                        className="p-2 hover:bg-green-600/20 rounded transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="p-2 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No team members found</p>
        </div>
      )}

      {showAddMember && (
        <div className="mt-6 bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <UserPlus className="w-5 h-5 text-green-400" />
            <h4 className="text-lg font-semibold text-white">Add Team Member</h4>
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
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                  disabled={inviting}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {inviteRole === 'member' && (
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-600">
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
                <div className="bg-gray-800 rounded p-3 mb-3">
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
  );
};
