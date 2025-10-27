import React from 'react';
import { CustomAuth } from './CustomAuth';

export const AuthScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-blue-400 shadow-lg">
            <span className="text-5xl">🚀</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-3 flex-wrap">
            <span className="text-blue-400">AI Rocket</span>
            <span className="text-white font-normal">+</span>
            <span className="text-emerald-400">Astra Intelligence</span>
          </h1>
          <p className="text-gray-400">AI For Entrepreneurs</p>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl p-8">
          <CustomAuth />
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Part of the RocketHub Ecosystem</p>
        </div>
      </div>
    </div>
  );
};
