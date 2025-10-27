import React, { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';

export const AuthScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-4xl font-bold text-white mb-2">Astra Intelligence</h1>
          <p className="text-gray-400">AI Connected to ALL Your Data</p>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl p-8">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                    inputBackground: '#1f2937',
                    inputText: '#ffffff',
                    inputBorder: '#374151',
                    inputBorderFocus: '#3b82f6',
                    inputBorderHover: '#4b5563',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
                input: 'auth-input',
              },
            }}
            providers={[]}
            redirectTo={window.location.origin}
          />
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Part of the RocketHub Ecosystem</p>
        </div>
      </div>
    </div>
  );
};
