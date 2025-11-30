import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface DocumentCounts {
  strategy: number;
  meetings: number;
  financial: number;
  projects: number;
  total: number;
}

export function useDocumentCounts() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<DocumentCounts>({
    strategy: 0,
    meetings: 0,
    financial: 0,
    projects: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's team_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      const teamId = userData?.team_id;
      if (!teamId) {
        setCounts({ strategy: 0, meetings: 0, financial: 0, projects: 0, total: 0 });
        setLoading(false);
        return;
      }

      // Count strategy documents (from document_chunks table)
      const { count: strategyCount, error: strategyError } = await supabase
        .from('document_chunks')
        .select('source_id', { count: 'exact', head: true })
        .eq('team_id', teamId);

      if (strategyError) throw strategyError;

      // Count meeting documents (from document_chunks_meetings table)
      const { count: meetingsCount, error: meetingsError } = await supabase
        .from('document_chunks_meetings')
        .select('source_id', { count: 'exact', head: true })
        .eq('team_id', teamId);

      if (meetingsError) throw meetingsError;

      // Count financial documents (from document_chunks_financial table)
      const { count: financialCount, error: financialError } = await supabase
        .from('document_chunks_financial')
        .select('source_id', { count: 'exact', head: true })
        .eq('team_id', teamId);

      if (financialError) throw financialError;

      // Count unique strategy documents
      const { data: strategyDocs, error: strategyDocsError } = await supabase
        .from('document_chunks')
        .select('source_id')
        .eq('team_id', teamId);

      if (strategyDocsError) throw strategyDocsError;

      const uniqueStrategy = new Set(strategyDocs?.map(d => d.source_id) || []).size;

      // Count unique meeting documents
      const { data: meetingDocs, error: meetingDocsError } = await supabase
        .from('document_chunks_meetings')
        .select('source_id')
        .eq('team_id', teamId);

      if (meetingDocsError) throw meetingDocsError;

      const uniqueMeetings = new Set(meetingDocs?.map(d => d.source_id) || []).size;

      // Count unique financial documents
      const { data: financialDocs, error: financialDocsError } = await supabase
        .from('document_chunks_financial')
        .select('source_id')
        .eq('team_id', teamId);

      if (financialDocsError) throw financialDocsError;

      const uniqueFinancial = new Set(financialDocs?.map(d => d.source_id) || []).size;

      // Projects folder check (from user_drive_connections)
      const { data: driveConnections, error: driveError } = await supabase
        .from('user_drive_connections')
        .select('projects_folder_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (driveError) throw driveError;

      const hasProjects = !!driveConnections?.projects_folder_id;

      const newCounts = {
        strategy: uniqueStrategy,
        meetings: uniqueMeetings,
        financial: uniqueFinancial,
        projects: hasProjects ? 1 : 0,
        total: uniqueStrategy + uniqueMeetings + uniqueFinancial
      };

      setCounts(newCounts);
      setError(null);
    } catch (err) {
      console.error('Error fetching document counts:', err);
      setError('Failed to load document counts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Calculate fuel level based on counts
  const calculateFuelLevel = useCallback((): number => {
    const { strategy, meetings, financial, projects } = counts;

    // Level 5: 10 strategy, 100 meetings, 10 financial, projects folder
    if (strategy >= 10 && meetings >= 100 && financial >= 10 && projects > 0) {
      return 5;
    }

    // Level 4: 10 strategy, 50 meetings, 10 financial
    if (strategy >= 10 && meetings >= 50 && financial >= 10) {
      return 4;
    }

    // Level 3: 3 strategy, 10 meetings, 3 financial
    if (strategy >= 3 && meetings >= 10 && financial >= 3) {
      return 3;
    }

    // Level 2: At least 1 from each category
    if (strategy >= 1 && meetings >= 1 && financial >= 1) {
      return 2;
    }

    // Level 1: At least 1 document total
    if (counts.total >= 1) {
      return 1;
    }

    // Level 0: No documents
    return 0;
  }, [counts]);

  // Get requirements for next level
  const getNextLevelRequirements = useCallback((currentLevel: number): string[] => {
    switch (currentLevel) {
      case 0:
        return ['Upload or create at least 1 document (any category)'];
      case 1:
        return [
          '1 strategy document',
          '1 meeting note',
          '1 financial record'
        ];
      case 2:
        return [
          '3 strategy documents',
          '10 meeting notes',
          '3 financial records'
        ];
      case 3:
        return [
          '10 strategy documents',
          '50 meeting notes',
          '10 financial records'
        ];
      case 4:
        return [
          '10 strategy documents',
          '100 meeting notes',
          '10 financial records',
          'Projects folder connected'
        ];
      case 5:
        return ['Maximum level reached!'];
      default:
        return [];
    }
  }, []);

  // Check if requirements are met for a specific level
  const meetsLevelRequirements = useCallback((level: number): boolean => {
    const { strategy, meetings, financial, projects } = counts;

    switch (level) {
      case 1:
        return counts.total >= 1;
      case 2:
        return strategy >= 1 && meetings >= 1 && financial >= 1;
      case 3:
        return strategy >= 3 && meetings >= 10 && financial >= 3;
      case 4:
        return strategy >= 10 && meetings >= 50 && financial >= 10;
      case 5:
        return strategy >= 10 && meetings >= 100 && financial >= 10 && projects > 0;
      default:
        return false;
    }
  }, [counts]);

  useEffect(() => {
    if (user) {
      fetchCounts();
    }
  }, [user, fetchCounts]);

  // Real-time subscription for document changes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('document_count_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_chunks'
        },
        () => {
          fetchCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_chunks_meetings'
        },
        () => {
          fetchCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_chunks_financial'
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchCounts]);

  return {
    counts,
    loading,
    error,
    calculateFuelLevel,
    getNextLevelRequirements,
    meetsLevelRequirements,
    refresh: fetchCounts
  };
}
