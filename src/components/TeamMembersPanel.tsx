import React, { useState, useEffect } from 'react';
import { Users, Shield, Edit2, Trash2, Save, X } from 'lucide-react';
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

  const isAdmin = user?.user_metadata?.role === 'admin';
  const teamId = user?.user_metadata?.team_id;

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
      <div className="flex items-center space-x-3 mb-6">
        <Users className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Team Members</h3>
        <span className="text-sm text-gray-400">({members.length})</span>
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
    </div>
  );
};
