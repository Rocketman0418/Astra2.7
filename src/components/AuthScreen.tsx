import React from 'react';
import { CustomAuth } from './CustomAuth';

export const AuthScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <CustomAuth />

        <div className="text-center text-xs text-gray-500">
          <p>&copy; 2025 RocketHub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
