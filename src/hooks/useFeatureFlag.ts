import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to check if a feature flag is enabled for the current user
 * @param featureName - The name of the feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export const useFeatureFlag = (featureName: string): boolean => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsEnabled(false);
          setLoading(false);
          return;
        }

        // Check feature_flags table
        const { data, error } = await supabase
          .from('feature_flags')
          .select('enabled')
          .eq('user_id', user.id)
          .eq('feature_name', featureName)
          .maybeSingle();

        if (error) {
          console.error('Error checking feature flag:', error);
          setIsEnabled(false);
        } else {
          setIsEnabled(data?.enabled ?? false);
        }
      } catch (error) {
        console.error('Error in feature flag check:', error);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeatureFlag();
  }, [featureName]);

  return loading ? false : isEnabled;
};
