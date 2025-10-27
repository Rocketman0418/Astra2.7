import React, { useState } from 'react';
import { Mail, Lock, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthMode = 'signup' | 'login';

export const CustomAuth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateInviteCode = async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error validating invite code:', error);
        return false;
      }

      if (!data) {
        setError('Invalid invite code');
        return false;
      }

      if (data.current_uses >= data.max_uses) {
        setError('This invite code has reached its maximum uses');
        return false;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This invite code has expired');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error validating invite code:', err);
      setError('Failed to validate invite code');
      return false;
    }
  };

  const incrementInviteCodeUse = async (code: string) => {
    try {
      const { data: inviteData } = await supabase
        .from('invite_codes')
        .select('current_uses')
        .eq('code', code.toUpperCase())
        .single();

      if (inviteData) {
        await supabase
          .from('invite_codes')
          .update({ current_uses: inviteData.current_uses + 1 })
          .eq('code', code.toUpperCase());
      }
    } catch (err) {
      console.error('Error incrementing invite code use:', err);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password || !inviteCode) {
        setError('All fields are required');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const isValidCode = await validateInviteCode(inviteCode);
      if (!isValidCode) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            invite_code: inviteCode.toUpperCase()
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        await incrementInviteCodeUse(inviteCode);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => {
            setMode('signup');
            setError('');
          }}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            mode === 'signup'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Create Account
        </button>
        <button
          onClick={() => {
            setMode('login');
            setError('');
          }}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            mode === 'login'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Login
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={mode === 'signup' ? handleSignUp : handleLogin} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Choose a password (min 6 characters)' : 'Your password'}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>
        </div>

        {mode === 'signup' && (
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Invite Code</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter your invite code"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Need an invite code? Contact your administrator
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 mt-6"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{mode === 'signup' ? 'Creating Account...' : 'Logging In...'}</span>
            </>
          ) : (
            <span>{mode === 'signup' ? 'Create Account' : 'Log In'}</span>
          )}
        </button>
      </form>

      {mode === 'signup' && (
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-400 text-sm font-medium mb-2">Welcome to AI Rocket + Astra Intelligence!</p>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>• Create your account with a valid invite code</li>
            <li>• Access AI-powered insights for your business</li>
            <li>• Connect your data sources for personalized intelligence</li>
            <li>• Collaborate with your team in real-time</li>
          </ul>
        </div>
      )}
    </div>
  );
};
