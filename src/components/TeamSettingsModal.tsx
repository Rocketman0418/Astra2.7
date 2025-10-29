import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TeamSettings, MeetingType, NewsPreferences } from '../types';
import { MeetingTypesSection } from './MeetingTypesSection';
import { NewsPreferencesSection } from './NewsPreferencesSection';

interface TeamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  isOnboarding?: boolean;
}

const DEFAULT_MEETING_TYPES: MeetingType[] = [
  {
    type: 'Team Leadership Meeting',
    description: 'Weekly or regular leadership team meetings',
    enabled: true,
  },
  {
    type: '1-1 Meeting',
    description: 'One-on-one discussions between team members',
    enabled: true,
  },
  {
    type: 'Customer Meeting',
    description: 'Meetings with customers and clients',
    enabled: true,
  },
  {
    type: 'Vendor Meeting',
    description: 'Meetings with vendors and suppliers',
    enabled: true,
  },
  {
    type: 'Sales Call',
    description: 'Sales-related calls and meetings',
    enabled: true,
  },
  {
    type: 'Misc Meeting',
    description: 'Other meetings not covered by standard types',
    enabled: true,
  },
];

const DEFAULT_NEWS_PREFERENCES: NewsPreferences = {
  enabled: false,
  industries: [],
  custom_topics: '',
  max_results: 10,
};

export const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({
  isOpen,
  onClose,
  teamId,
  isOnboarding = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>(DEFAULT_MEETING_TYPES);
  const [newsPreferences, setNewsPreferences] = useState<NewsPreferences>(
    DEFAULT_NEWS_PREFERENCES
  );

  useEffect(() => {
    if (isOpen && teamId) {
      loadTeamSettings();
    }
  }, [isOpen, teamId]);

  const loadTeamSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('team_settings')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setMeetingTypes(data.meeting_types || DEFAULT_MEETING_TYPES);
        setNewsPreferences(data.news_preferences || DEFAULT_NEWS_PREFERENCES);
      } else {
        setMeetingTypes(DEFAULT_MEETING_TYPES);
        setNewsPreferences(DEFAULT_NEWS_PREFERENCES);
      }
    } catch (err: any) {
      console.error('Error loading team settings:', err);
      setError('Failed to load team settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const enabledCount = meetingTypes.filter((t) => t.enabled).length;
    if (enabledCount === 0) {
      setError('At least one meeting type must be enabled');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: saveError } = await supabase
        .from('team_settings')
        .upsert(
          {
            team_id: teamId,
            meeting_types: meetingTypes,
            news_preferences: newsPreferences,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'team_id',
          }
        );

      if (saveError) throw saveError;

      setSuccessMessage('Team settings saved successfully');
      setHasUnsavedChanges(false);

      if (isOnboarding) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error saving team settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges && !isOnboarding) {
      if (
        window.confirm(
          'You have unsaved changes. Are you sure you want to close without saving?'
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSkip = async () => {
    if (!isOnboarding) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: saveError } = await supabase
        .from('team_settings')
        .upsert(
          {
            team_id: teamId,
            meeting_types: DEFAULT_MEETING_TYPES,
            news_preferences: DEFAULT_NEWS_PREFERENCES,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'team_id',
          }
        );

      if (saveError) throw saveError;

      setSuccessMessage(
        'Default meeting types saved. News monitoring is disabled. You can customize these settings anytime in User Settings.'
      );
      setHasUnsavedChanges(false);

      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Error saving default settings:', err);
      setError('Failed to save default settings. Please try again.');
      setIsSaving(false);
    }
  };

  const handleMeetingTypesChange = (types: MeetingType[]) => {
    setMeetingTypes(types);
    setHasUnsavedChanges(true);
  };

  const handleNewsPreferencesChange = (prefs: NewsPreferences) => {
    setNewsPreferences(prefs);
    setHasUnsavedChanges(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0d1117] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isOnboarding ? 'Set Up Team Settings' : 'Team Settings'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {isOnboarding
                ? 'Configure your team preferences to help Astra better assist you'
                : 'Manage your team preferences'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              <MeetingTypesSection
                meetingTypes={meetingTypes}
                onChange={handleMeetingTypesChange}
              />

              <div className="border-t border-gray-700 my-8"></div>

              <NewsPreferencesSection
                preferences={newsPreferences}
                onChange={handleNewsPreferencesChange}
              />
            </>
          )}
        </div>

        <div className="border-t border-gray-700 p-6 space-y-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          <div className="flex justify-end gap-3">
            {isOnboarding && (
              <button
                onClick={handleSkip}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                Use Defaults & Continue
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
