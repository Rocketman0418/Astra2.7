import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface LaunchStatus {
  user_id: string;
  current_stage: 'fuel' | 'boosters' | 'guidance' | 'ready' | 'launched';
  total_points: number;
  is_launched: boolean;
  launched_at: string | null;
  daily_streak: number;
  last_active_date: string | null;
}

export interface StageProgress {
  id: string;
  user_id: string;
  stage: 'fuel' | 'boosters' | 'guidance';
  level: number;
  points_earned: number;
  achievements: string[];
  stage_started_at: string;
  level_completed_at: string | null;
}

export interface PointsEntry {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  reason_display: string;
  stage: string;
  metadata: any;
  created_at: string;
}

export interface Achievement {
  id: string;
  achievement_key: string;
  name: string;
  description: string;
  stage: string;
  level: number;
  points_value: number;
  icon: string;
  display_order: number;
}

export function useLaunchPreparation() {
  const { user } = useAuth();
  const [launchStatus, setLaunchStatus] = useState<LaunchStatus | null>(null);
  const [stageProgress, setStageProgress] = useState<StageProgress[]>([]);
  const [recentPoints, setRecentPoints] = useState<PointsEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is eligible for launch preparation
  const checkEligibility = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('launch_preparation_eligible_users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (err) {
      console.error('Error checking eligibility:', err);
      return false;
    }
  }, []);

  // Initialize launch status for new user
  const initializeLaunchStatus = useCallback(async () => {
    if (!user) return;

    try {
      // Check if status already exists
      const { data: existingStatus } = await supabase
        .from('user_launch_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingStatus) {
        setLaunchStatus(existingStatus);
        return;
      }

      // Create new launch status
      const { data: newStatus, error: statusError } = await supabase
        .from('user_launch_status')
        .insert({
          user_id: user.id,
          current_stage: 'fuel',
          total_points: 0,
          is_launched: false,
          daily_streak: 0
        })
        .select()
        .single();

      if (statusError) throw statusError;

      // Initialize all three stage progress records
      const stages: ('fuel' | 'boosters' | 'guidance')[] = ['fuel', 'boosters', 'guidance'];
      const { error: progressError } = await supabase
        .from('launch_preparation_progress')
        .insert(
          stages.map(stage => ({
            user_id: user.id,
            stage,
            level: 0,
            points_earned: 0,
            achievements: []
          }))
        );

      if (progressError) throw progressError;

      setLaunchStatus(newStatus);
      await fetchStageProgress();
    } catch (err) {
      console.error('Error initializing launch status:', err);
      setError('Failed to initialize launch preparation');
    }
  }, [user]);

  // Fetch user's launch status
  const fetchLaunchStatus = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_launch_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        await initializeLaunchStatus();
      } else {
        setLaunchStatus(data);
      }
    } catch (err) {
      console.error('Error fetching launch status:', err);
      setError('Failed to load launch status');
    }
  }, [user, initializeLaunchStatus]);

  // Fetch stage progress for all stages
  const fetchStageProgress = useCallback(async (): Promise<StageProgress[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('launch_preparation_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('stage');

      if (error) throw error;
      const progressData = data || [];
      setStageProgress(progressData);
      return progressData;
    } catch (err) {
      console.error('Error fetching stage progress:', err);
      return [];
    }
  }, [user]);

  // Fetch recent points
  const fetchRecentPoints = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('launch_points_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentPoints(data || []);
    } catch (err) {
      console.error('Error fetching recent points:', err);
    }
  }, [user]);

  // Fetch all achievements
  const fetchAchievements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('launch_achievements')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setAchievements(data || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
    }
  }, []);

  // Get progress for specific stage
  const getStageProgress = useCallback((stage: 'fuel' | 'boosters' | 'guidance'): StageProgress | null => {
    return stageProgress.find(p => p.stage === stage) || null;
  }, [stageProgress]);

  // Award points to user
  const awardPoints = useCallback(async (
    points: number,
    reason: string,
    reasonDisplay: string,
    stage: string,
    metadata: any = {}
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Insert into points ledger
      const { error: ledgerError } = await supabase
        .from('launch_points_ledger')
        .insert({
          user_id: user.id,
          points,
          reason,
          reason_display: reasonDisplay,
          stage,
          metadata
        });

      if (ledgerError) throw ledgerError;

      // Update total points in launch status
      const { error: statusError } = await supabase
        .from('user_launch_status')
        .update({
          total_points: (launchStatus?.total_points || 0) + points,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (statusError) throw statusError;

      // Refresh data
      await Promise.all([
        fetchLaunchStatus(),
        fetchRecentPoints()
      ]);

      return true;
    } catch (err) {
      console.error('Error awarding points:', err);
      return false;
    }
  }, [user, launchStatus, fetchLaunchStatus, fetchRecentPoints]);

  // Mark achievement as complete
  const completeAchievement = useCallback(async (
    achievementKey: string,
    stage: 'fuel' | 'boosters' | 'guidance'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get achievement details
      const achievement = achievements.find(a => a.achievement_key === achievementKey);
      if (!achievement) {
        console.error('Achievement not found:', achievementKey);
        return false;
      }

      // Get current stage progress
      const progress = getStageProgress(stage);
      if (!progress) {
        console.error('Stage progress not found:', stage);
        return false;
      }

      // Check if already completed
      if (progress.achievements.includes(achievementKey)) {
        return true; // Already completed
      }

      // Add achievement to progress
      const updatedAchievements = [...progress.achievements, achievementKey];

      // Update stage progress
      const { error: progressError } = await supabase
        .from('launch_preparation_progress')
        .update({
          achievements: updatedAchievements,
          points_earned: progress.points_earned + achievement.points_value,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('stage', stage);

      if (progressError) throw progressError;

      // Award points
      await awardPoints(
        achievement.points_value,
        achievementKey,
        achievement.name,
        stage,
        { achievement_key: achievementKey }
      );

      // Refresh stage progress
      await fetchStageProgress();

      return true;
    } catch (err) {
      console.error('Error completing achievement:', err);
      return false;
    }
  }, [user, achievements, getStageProgress, awardPoints, fetchStageProgress]);

  // Update stage level
  const updateStageLevel = useCallback(async (
    stage: 'fuel' | 'boosters' | 'guidance',
    newLevel: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('launch_preparation_progress')
        .update({
          level: newLevel,
          level_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('stage', stage);

      if (error) throw error;

      await fetchStageProgress();
      return true;
    } catch (err) {
      console.error('Error updating stage level:', err);
      return false;
    }
  }, [user, fetchStageProgress]);

  // Update current stage
  const updateCurrentStage = useCallback(async (
    newStage: 'fuel' | 'boosters' | 'guidance' | 'ready' | 'launched'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData: any = {
        current_stage: newStage,
        updated_at: new Date().toISOString()
      };

      if (newStage === 'launched') {
        updateData.is_launched = true;
        updateData.launched_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_launch_status')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchLaunchStatus();
      return true;
    } catch (err) {
      console.error('Error updating current stage:', err);
      return false;
    }
  }, [user, fetchLaunchStatus]);

  // Mark user as active today
  const markActiveToday = useCallback(async (): Promise<void> => {
    if (!user || !launchStatus) return;

    const today = new Date().toISOString().split('T')[0];
    const lastActive = launchStatus.last_active_date;

    // If already active today, skip
    if (lastActive === today) return;

    try {
      let newStreak = 1;

      // Check if this continues a streak
      if (lastActive) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActive === yesterdayStr) {
          newStreak = launchStatus.daily_streak + 1;
        }
      }

      // Update status
      const { error } = await supabase
        .from('user_launch_status')
        .update({
          last_active_date: today,
          daily_streak: newStreak,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Award daily active points
      await awardPoints(10, 'ongoing_daily_active', 'Daily Active', 'ongoing');

      // Check for streak achievements
      if (newStreak === 7) {
        await completeAchievement('ongoing_streak_7_days', 'guidance');
      } else if (newStreak === 30) {
        await completeAchievement('ongoing_streak_30_days', 'guidance');
      }

      await fetchLaunchStatus();
    } catch (err) {
      console.error('Error marking user active:', err);
    }
  }, [user, launchStatus, awardPoints, completeAchievement, fetchLaunchStatus]);

  // Initial data load
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchLaunchStatus(),
          fetchStageProgress(),
          fetchRecentPoints(),
          fetchAchievements()
        ]);
        setLoading(false);
      };

      loadData();
    }
  }, [user, fetchLaunchStatus, fetchStageProgress, fetchRecentPoints, fetchAchievements]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const statusSubscription = supabase
      .channel('launch_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_launch_status',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchLaunchStatus();
        }
      )
      .subscribe();

    const progressSubscription = supabase
      .channel('launch_progress_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'launch_preparation_progress',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchStageProgress();
        }
      )
      .subscribe();

    return () => {
      statusSubscription.unsubscribe();
      progressSubscription.unsubscribe();
    };
  }, [user, fetchLaunchStatus, fetchStageProgress]);

  return {
    launchStatus,
    stageProgress,
    recentPoints,
    achievements,
    loading,
    error,
    checkEligibility,
    initializeLaunchStatus,
    getStageProgress,
    awardPoints,
    completeAchievement,
    updateStageLevel,
    updateCurrentStage,
    markActiveToday,
    fetchStageProgress,
    refresh: async () => {
      await Promise.all([
        fetchLaunchStatus(),
        fetchStageProgress(),
        fetchRecentPoints()
      ]);
    }
  };
}
