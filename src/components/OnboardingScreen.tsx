import React, { useState } from 'react';
import { Users, UserCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TeamSettingsModal } from './TeamSettingsModal';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [fullName, setFullName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);

  const handleBackToLogin = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!fullName.trim() || !teamName.trim()) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No user found. Please log in again.');
        setLoading(false);
        return;
      }

      // Check if user has pending team setup (new team invite from signup)
      // Also check if user exists in public.users but has no team (partial setup)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, team_id')
        .eq('id', user.id)
        .maybeSingle();

      const pendingSetup = user.user_metadata?.pending_team_setup;
      const hasPendingSetup = pendingSetup === true || pendingSetup === 'true';
      const inviteCode = user.user_metadata?.invite_code;
      const hasIncompleteSetup = existingUser && !existingUser.team_id && inviteCode;

      console.log('Onboarding check:', { hasPendingSetup, hasIncompleteSetup, inviteCode, existingUser });

      if ((hasPendingSetup || hasIncompleteSetup) && inviteCode) {
        console.log('Completing pending team setup via RPC');

        // Complete signup with team name via RPC
        const { data: setupResult, error: setupError } = await supabase.rpc('complete_user_signup', {
          p_invite_code: inviteCode,
          p_new_team_name: teamName.trim()
        });

        if (setupError) {
          console.error('Setup error:', setupError);
          throw new Error(`Failed to complete setup: ${setupError.message}`);
        }

        if (!setupResult?.success) {
          console.error('Setup failed:', setupResult);
          throw new Error(setupResult?.error || 'Failed to complete setup');
        }

        console.log('Setup completed successfully:', setupResult);

        // Update user name
        const { error: nameUpdateError } = await supabase
          .from('users')
          .update({ name: fullName.trim() })
          .eq('id', user.id);

        if (nameUpdateError) throw nameUpdateError;

        // Update auth metadata to remove pending flag and add name
        await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            pending_team_setup: false
          }
        });

        // Show team settings modal
        setCreatedTeamId(setupResult.team_id);
        setShowTeamSettings(true);
      } else {
        // Legacy flow: user didn't go through invite signup
        console.log('Using legacy onboarding flow');

        // Create team
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .insert({
            name: teamName.trim(),
            created_by: user.id
          })
          .select()
          .single();

        if (teamError) throw teamError;

        // Update public.users table with team and profile information
        const { error: usersError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email!,
            name: fullName.trim(),
            team_id: teamData.id,
            role: 'admin',
            view_financial: true
          });

        if (usersError) throw usersError;

        // Update auth metadata
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            team_id: teamData.id,
            role: 'admin',
            view_financial: true
          }
        });

        if (updateError) throw updateError;

        // Show team settings modal
        setCreatedTeamId(teamData.id);
        setShowTeamSettings(true);
      }
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSettingsClose = () => {
    setShowTeamSettings(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-blue-400 shadow-lg">
            <span className="text-5xl">🚀</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-3 flex-wrap">
            <span className="text-blue-400">AI Rocket</span>
            <span className="text-white font-normal">+</span>
            <span className="text-emerald-400">Astra</span>
          </h1>
          <p className="text-gray-400">Let's set up your account</p>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Your Full Name</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Create Your Team</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Company, Project, or Group Name"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This is your team name. You can invite members later.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Launching...</span>
                </>
              ) : (
                <span>Launch AI Rocket</span>
              )}
            </button>
          </form>
        </div>

        <div className="text-center space-y-3">
          <button
            onClick={handleBackToLogin}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
          <p className="text-sm text-gray-500">Part of the RocketHub Ecosystem</p>
        </div>
      </div>

      {createdTeamId && (
        <TeamSettingsModal
          isOpen={showTeamSettings}
          onClose={handleTeamSettingsClose}
          teamId={createdTeamId}
          isOnboarding={true}
        />
      )}
    </div>
  );
};
