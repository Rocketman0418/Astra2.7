import React from 'react';
import { X } from 'lucide-react';
import { NewsPreferences } from '../types';

interface NewsPreferencesSectionProps {
  preferences: NewsPreferences;
  onChange: (preferences: NewsPreferences) => void;
}

const INDUSTRY_OPTIONS = [
  'AI',
  'Healthcare',
  'SaaS',
  'FinTech',
  'E-commerce',
  'Marketing',
  'Manufacturing',
  'Real Estate',
  'Education',
  'Legal',
  'Consulting',
  'Other',
];

export const NewsPreferencesSection: React.FC<NewsPreferencesSectionProps> = ({
  preferences,
  onChange,
}) => {
  const handleToggleEnabled = () => {
    onChange({ ...preferences, enabled: !preferences.enabled });
  };

  const handleToggleIndustry = (industry: string) => {
    const newIndustries = preferences.industries.includes(industry)
      ? preferences.industries.filter((i) => i !== industry)
      : [...preferences.industries, industry];
    onChange({ ...preferences, industries: newIndustries });
  };

  const handleCustomTopicsChange = (value: string) => {
    onChange({ ...preferences, custom_topics: value });
  };

  const handleMaxResultsChange = (value: number) => {
    onChange({ ...preferences, max_results: value });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-white">News & Industry Updates</h2>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={handleToggleEnabled}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>
        <p className="text-sm text-gray-400">
          Configure what news and industry updates the AI should monitor for your team.
        </p>
      </div>

      {preferences.enabled ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Industries
            </label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_OPTIONS.map((industry) => {
                const isSelected = preferences.industries.includes(industry);
                return (
                  <button
                    key={industry}
                    onClick={() => handleToggleIndustry(industry)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {industry}
                    {isSelected && <X className="inline w-3 h-3 ml-1" />}
                  </button>
                );
              })}
            </div>
            {preferences.industries.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {preferences.industries.length} {preferences.industries.length === 1 ? 'industry' : 'industries'} selected
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Topics
            </label>
            <textarea
              value={preferences.custom_topics}
              onChange={(e) => handleCustomTopicsChange(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full bg-[#0d1117] text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Enter specific topics, trends, or keywords separated by commas"
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: AI agents, healthcare automation, B2B SaaS pricing
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {preferences.custom_topics.length} / 1000 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Maximum News Results: {preferences.max_results}
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">5</span>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={preferences.max_results}
                onChange={(e) => handleMaxResultsChange(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-sm text-gray-500">50</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Number of news articles to retrieve per search
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>News monitoring is disabled.</p>
          <p className="text-sm mt-2">Enable it to configure preferences.</p>
        </div>
      )}
    </div>
  );
};
