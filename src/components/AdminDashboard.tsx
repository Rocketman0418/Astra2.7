import React, { useState, useEffect } from 'react';
import {
  Users, Building2, FileText, MessageSquare, BarChart3, Download,
  TrendingUp, Mail, HardDrive, AlertCircle,
  CheckCircle, XCircle, Search, ArrowUpDown, MessageCircleQuestion, Shield, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface UserMetric {
  id: string;
  email: string;
  created_at: string;
  team_id: string;
  team_name: string;
  role: string;
  last_sign_in_at: string;
  private_chats_count: number;
  team_messages_count: number;
  documents_synced: boolean;
  strategy_docs_count: number;
  meeting_docs_count: number;
  financial_docs_count: number;
  total_docs_count: number;
  reports_count: number;
  gmail_connected: boolean;
  drive_connected: boolean;
}

interface OverviewMetrics {
  totalUsers: number;
  totalTeams: number;
  totalDocuments: number;
  totalChats: number;
  totalReports: number;
  activeUsersLast7Days: number;
  activeUsersLast30Days: number;
}

interface FeedbackItem {
  id: string;
  user_email: string;
  created_at: string;
  answers: Array<{
    question_text: string;
    rating: number;
    comment: string | null;
  }>;
  general_feedback: string | null;
}

interface SupportMessage {
  id: string;
  user_email: string;
  created_at: string;
  support_type: string;
  support_details: {
    subject?: string;
    description?: string;
    url_context?: string;
  };
  attachment_urls: string[];
}

interface FeedbackStats {
  avgRatingByCategory: Record<string, number>;
  totalResponses: number;
  categoryBreakdown: Array<{
    category: string;
    avg_rating: number;
    count: number;
  }>;
}

type TimeFilter = '7days' | '30days' | '90days' | 'all';
type SortField = 'email' | 'created_at' | 'team_name' | 'documents' | 'messages';
type SortDirection = 'asc' | 'desc';
type DetailView = 'users' | 'teams' | 'documents' | 'chats' | null;
type SupportFilter = 'all' | 'bug_report' | 'support_message' | 'feature_request';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics | null>(null);
  const [users, setUsers] = useState<UserMetric[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [detailView, setDetailView] = useState<DetailView>(null);
  const [supportFilter, setSupportFilter] = useState<SupportFilter>('all');
  const [teamsData, setTeamsData] = useState<Array<{ id: string; name: string; created_at: string; member_count: number }>>([]);

  const isSuperAdmin = user?.email === 'clay@rockethub.ai';

  useEffect(() => {
    if (isOpen && user && isSuperAdmin) {
      loadAllMetrics();
    }
  }, [isOpen, timeFilter, user, isSuperAdmin]);

  const loadAllMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_dashboard_data');

      if (error) throw error;

      if (data) {
        processAdminDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAdminDashboardData = (data: any) => {
    const users = data.users || [];
    const teams = data.teams || [];
    const documents = data.documents || [];
    const chats = data.chats || [];
    const reports = data.reports || [];
    const gmailConnections = data.gmail_connections || [];
    const driveConnections = data.drive_connections || [];
    const allFeedback = data.feedback || [];

    const teamMap = new Map(teams.map((t: any) => [t.id, t.name]));
    const gmailMap = new Map(gmailConnections.map((g: any) => [g.user_id, g.is_active]));
    const driveMap = new Map(driveConnections.map((d: any) => [d.user_id, d.is_active]));

    const enrichedUsers = users.map((user: any) => {
      const userChats = chats.filter((c: any) => c.user_id === user.id);
      const privateChats = userChats.filter((c: any) => c.mode === 'private').length;
      const teamMessages = userChats.filter((c: any) => c.mode === 'team').length;

      const userDocs = documents.filter((d: any) => d.team_id === user.team_id);
      const strategyCount = userDocs.filter((d: any) => d.folder_type === 'strategy').length;
      const meetingCount = userDocs.filter((d: any) => d.folder_type === 'meeting').length;
      const financialCount = userDocs.filter((d: any) => d.folder_type === 'financial').length;
      const totalDocs = strategyCount + meetingCount + financialCount;

      const userReports = reports.filter((r: any) => r.user_id === user.id).length;

      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        team_id: user.team_id,
        team_name: teamMap.get(user.team_id) || 'No Team',
        role: user.role || 'member',
        last_sign_in_at: user.last_sign_in_at || user.created_at,
        private_chats_count: privateChats,
        team_messages_count: teamMessages,
        documents_synced: totalDocs > 0,
        strategy_docs_count: strategyCount,
        meeting_docs_count: meetingCount,
        financial_docs_count: financialCount,
        total_docs_count: totalDocs,
        reports_count: userReports,
        gmail_connected: gmailMap.get(user.id) || false,
        drive_connected: driveMap.get(user.id) || false
      };
    });

    const enrichedTeams = teams.map((team: any) => {
      const memberCount = users.filter((u: any) => u.team_id === team.id).length;
      return {
        id: team.id,
        name: team.name,
        created_at: team.created_at,
        member_count: memberCount
      };
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const active7Days = users.filter((u: any) =>
      u.last_sign_in_at && new Date(u.last_sign_in_at) >= sevenDaysAgo
    ).length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const active30Days = users.filter((u: any) =>
      u.last_sign_in_at && new Date(u.last_sign_in_at) >= thirtyDaysAgo
    ).length;

    const feedbackSubmissions = allFeedback.filter((f: any) => !f.support_type);
    const supportMsgs = allFeedback.filter((f: any) => f.support_type);

    setUsers(enrichedUsers);
    setTeamsData(enrichedTeams);
    setOverviewMetrics({
      totalUsers: users.length,
      totalTeams: teams.length,
      totalDocuments: documents.length,
      totalChats: chats.length,
      totalReports: reports.length,
      activeUsersLast7Days: active7Days,
      activeUsersLast30Days: active30Days
    });
    setSupportMessages(supportMsgs.map((msg: any) => ({
      id: msg.id,
      user_email: users.find((u: any) => u.id === msg.user_id)?.email || 'Unknown',
      created_at: msg.created_at,
      support_type: msg.support_type,
      support_details: msg.support_details || {},
      attachment_urls: msg.attachment_urls || []
    })));
    setFeedback(feedbackSubmissions.map((fb: any) => ({
      id: fb.id,
      user_email: users.find((u: any) => u.id === fb.user_id)?.email || 'Unknown',
      created_at: fb.created_at,
      answers: [],
      general_feedback: fb.general_feedback
    })));
  };

  const loadTeams = async () => {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedTeams = await Promise.all((teams || []).map(async (team) => {
        const { count: memberCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id);

        return {
          id: team.id,
          name: team.name,
          created_at: team.created_at,
          member_count: memberCount || 0
        };
      }));

      setTeamsData(enrichedTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadOverviewMetrics = async () => {
    try {
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { data: teamsCount } = await supabase
        .from('teams')
        .select('id');

      const { count: totalDocuments } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      const { count: privateChats } = await supabase
        .from('astra_chats')
        .select('*', { count: 'exact', head: true });

      const { count: teamMessages } = await supabase
        .from('astra_team_messages')
        .select('*', { count: 'exact', head: true });

      const { count: reports } = await supabase
        .from('user_reports')
        .select('*', { count: 'exact', head: true });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: active7Days } = await supabase
        .from('users')
        .select('id')
        .gte('last_sign_in_at', sevenDaysAgo.toISOString());

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: active30Days } = await supabase
        .from('users')
        .select('id')
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString());

      setOverviewMetrics({
        totalUsers: totalUsers || 0,
        totalTeams: teamsCount?.length || 0,
        totalDocuments: totalDocuments || 0,
        totalChats: (privateChats || 0) + (teamMessages || 0),
        totalReports: reports || 0,
        activeUsersLast7Days: active7Days?.length || 0,
        activeUsersLast30Days: active30Days?.length || 0
      });
    } catch (error) {
      console.error('Error loading overview metrics:', error);
    }
  };

  const loadUserMetrics = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, created_at, team_id, role, last_sign_in_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name');

      const teamMap = new Map(teamsData?.map(t => [t.id, t.name]) || []);

      const enrichedUsers = await Promise.all((usersData || []).map(async (user) => {
        const [
          { count: privateChats },
          { count: teamMessages },
          { data: documents },
          { count: reports },
          { data: gmailAuth },
          { data: driveConn }
        ] = await Promise.all([
          supabase.from('astra_chats').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('astra_team_messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('documents').select('id, folder_type').eq('team_id', user.team_id),
          supabase.from('user_reports').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('gmail_auth').select('is_active').eq('user_id', user.id).maybeSingle(),
          supabase.from('user_drive_connections').select('is_active').eq('user_id', user.id).maybeSingle()
        ]);

        const strategyCount = documents?.filter(d => d.folder_type === 'strategy').length || 0;
        const meetingCount = documents?.filter(d => d.folder_type === 'meeting').length || 0;
        const financialCount = documents?.filter(d => d.folder_type === 'financial').length || 0;
        const totalDocs = strategyCount + meetingCount + financialCount;

        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          team_id: user.team_id,
          team_name: teamMap.get(user.team_id) || 'No Team',
          role: user.role || 'member',
          last_sign_in_at: user.last_sign_in_at || user.created_at,
          private_chats_count: privateChats || 0,
          team_messages_count: teamMessages || 0,
          documents_synced: totalDocs > 0,
          strategy_docs_count: strategyCount,
          meeting_docs_count: meetingCount,
          financial_docs_count: financialCount,
          total_docs_count: totalDocs,
          reports_count: reports || 0,
          gmail_connected: gmailAuth?.is_active || false,
          drive_connected: driveConn?.is_active || false
        };
      }));

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error loading user metrics:', error);
    }
  };

  const loadFeedback = async () => {
    try {
      const { data: submissions, error: submissionsError } = await supabase
        .from('user_feedback_submissions')
        .select('id, user_id, submitted_at, general_feedback')
        .is('support_type', null)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      const enrichedFeedback = await Promise.all((submissions || []).map(async (submission) => {
        const [
          { data: userData },
          { data: answers }
        ] = await Promise.all([
          supabase.from('users').select('email').eq('id', submission.user_id).maybeSingle(),
          supabase.from('user_feedback_answers')
            .select(`
              rating,
              comment,
              feedback_questions(question_text)
            `)
            .eq('submission_id', submission.id)
        ]);

        return {
          id: submission.id,
          user_email: userData?.email || 'Unknown',
          created_at: submission.submitted_at,
          answers: (answers || []).map(a => ({
            question_text: (a.feedback_questions as any)?.question_text || '',
            rating: a.rating,
            comment: a.comment
          })),
          general_feedback: submission.general_feedback
        };
      }));

      setFeedback(enrichedFeedback);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const loadFeedbackStats = async () => {
    try {
      const { data: answers } = await supabase
        .from('user_feedback_answers')
        .select(`
          rating,
          feedback_questions(question_text, category)
        `);

      if (!answers || answers.length === 0) return;

      const categoryStats: Record<string, { sum: number; count: number }> = {};

      answers.forEach(answer => {
        const category = (answer.feedback_questions as any)?.category || 'other';
        if (!categoryStats[category]) {
          categoryStats[category] = { sum: 0, count: 0 };
        }
        categoryStats[category].sum += answer.rating;
        categoryStats[category].count += 1;
      });

      const avgRatingByCategory: Record<string, number> = {};
      const categoryBreakdown = Object.entries(categoryStats).map(([category, stats]) => {
        const avg = stats.sum / stats.count;
        avgRatingByCategory[category] = avg;
        return {
          category,
          avg_rating: avg,
          count: stats.count
        };
      });

      setFeedbackStats({
        avgRatingByCategory,
        totalResponses: answers.length,
        categoryBreakdown: categoryBreakdown.sort((a, b) => b.avg_rating - a.avg_rating)
      });
    } catch (error) {
      console.error('Error loading feedback stats:', error);
    }
  };

  const loadSupportMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('user_feedback_submissions')
        .select('id, user_id, submitted_at, support_type, support_details, attachment_urls')
        .not('support_type', 'is', null)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const enrichedSupport = await Promise.all((data || []).map(async (msg) => {
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', msg.user_id)
          .maybeSingle();

        return {
          id: msg.id,
          user_email: userData?.email || 'Unknown',
          created_at: msg.submitted_at,
          support_type: msg.support_type || 'general',
          support_details: msg.support_details || {},
          attachment_urls: msg.attachment_urls || []
        };
      }));

      setSupportMessages(enrichedSupport);
    } catch (error) {
      console.error('Error loading support messages:', error);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const flattenObject = (obj: any, prefix = ''): any => {
      const flattened: any = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, flattenObject(value, newKey));
        } else if (Array.isArray(value)) {
          flattened[newKey] = JSON.stringify(value);
        } else {
          flattened[newKey] = value;
        }
      });
      return flattened;
    };

    const flatData = data.map(item => flattenObject(item));
    const headers = Object.keys(flatData[0]);

    const csvContent = [
      headers.join(','),
      ...flatData.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.team_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      if (timeFilter === '7days') filterDate.setDate(now.getDate() - 7);
      else if (timeFilter === '30days') filterDate.setDate(now.getDate() - 30);
      else if (timeFilter === '90days') filterDate.setDate(now.getDate() - 90);

      filtered = filtered.filter(user => new Date(user.created_at) >= filterDate);
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'documents') {
        aValue = a.total_docs_count;
        bValue = b.total_docs_count;
      } else if (sortField === 'messages') {
        aValue = a.private_chats_count + a.team_messages_count;
        bValue = b.private_chats_count + b.team_messages_count;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchQuery, timeFilter, sortField, sortDirection]);

  const filteredSupportMessages = React.useMemo(() => {
    if (supportFilter === 'all') return supportMessages;
    return supportMessages.filter(msg => msg.support_type === supportFilter);
  }, [supportMessages, supportFilter]);

  if (!isOpen) {
    return null;
  }

  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-6">You must be logged in to access this page.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-2">This page is restricted to super administrators only.</p>
          <p className="text-gray-500 text-sm mb-6">Your account: {user.email}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-8">
          <div className="flex items-center justify-between sticky top-0 bg-gray-900 py-4 z-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-sm md:text-base text-gray-400">Comprehensive metrics and analytics for AI Rocket</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="px-3 md:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
              <button
                onClick={onClose}
                className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Close Dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {overviewMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <button
                onClick={() => setDetailView('users')}
                className="bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-blue-500/20 text-left w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-400" />
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{overviewMetrics.totalUsers}</div>
                <div className="text-sm text-gray-400">Total Users</div>
                <div className="mt-2 text-xs text-gray-500">
                  Active: {overviewMetrics.activeUsersLast7Days} (7d) / {overviewMetrics.activeUsersLast30Days} (30d)
                </div>
              </button>

              <button
                onClick={() => setDetailView('teams')}
                className="bg-gray-800 border border-gray-700 hover:border-emerald-500 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-emerald-500/20 text-left w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <Building2 className="w-8 h-8 text-emerald-400" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{overviewMetrics.totalTeams}</div>
                <div className="text-sm text-gray-400">Total Teams</div>
              </button>

              <button
                onClick={() => setDetailView('documents')}
                className="bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-purple-500/20 text-left w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 text-purple-400" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{overviewMetrics.totalDocuments}</div>
                <div className="text-sm text-gray-400">Total Documents</div>
              </button>

              <button
                onClick={() => setDetailView('chats')}
                className="bg-gray-800 border border-gray-700 hover:border-orange-500 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-orange-500/20 text-left w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="w-8 h-8 text-orange-400" />
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{overviewMetrics.totalChats}</div>
                <div className="text-sm text-gray-400">Total Messages</div>
              </button>
            </div>
          )}

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" />
                User Metrics ({users.length})
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => exportToCSV(filteredAndSortedUsers, 'user-metrics')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white whitespace-nowrap"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        Email
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white whitespace-nowrap"
                      onClick={() => handleSort('team_name')}
                    >
                      <div className="flex items-center gap-2">
                        Team
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white whitespace-nowrap"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Joined
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 whitespace-nowrap">Last Active</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 whitespace-nowrap">Documents</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 whitespace-nowrap">Messages</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 whitespace-nowrap">Reports</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 whitespace-nowrap">Integrations</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 px-4">
                        <div className="text-sm text-white">{user.email}</div>
                        {user.role === 'admin' && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">{user.team_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap">
                        {format(new Date(user.last_sign_in_at), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {user.documents_synced ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm text-white">{user.total_docs_count}</span>
                        </div>
                        {user.documents_synced && (
                          <div className="text-xs text-gray-400 mt-1">
                            S:{user.strategy_docs_count} M:{user.meeting_docs_count} F:{user.financial_docs_count}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-white">{user.private_chats_count + user.team_messages_count}</div>
                        <div className="text-xs text-gray-400">
                          P:{user.private_chats_count} T:{user.team_messages_count}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-white">{user.reports_count}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {user.gmail_connected && (
                            <Mail className="w-4 h-4 text-emerald-400" title="Gmail Connected" />
                          )}
                          {user.drive_connected && (
                            <HardDrive className="w-4 h-4 text-blue-400" title="Drive Connected" />
                          )}
                          {!user.gmail_connected && !user.drive_connected && (
                            <span className="text-xs text-gray-500">None</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {feedbackStats && feedbackStats.categoryBreakdown.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                  Feedback Analytics
                </h2>
                <div className="text-sm text-gray-400">
                  {feedbackStats.totalResponses} total responses
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {feedbackStats.categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-300 capitalize">
                        {cat.category.replace(/_/g, ' ')}
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {cat.avg_rating.toFixed(1)}
                      </div>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${
                          cat.avg_rating >= 8 ? 'bg-emerald-500' :
                          cat.avg_rating >= 6 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(cat.avg_rating / 10) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      {cat.count} {cat.count === 1 ? 'response' : 'responses'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <MessageCircleQuestion className="w-6 h-6 text-purple-400" />
                User Feedback ({feedback.length})
              </h2>
              <button
                onClick={() => exportToCSV(feedback, 'user-feedback')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {feedback.map((fb) => (
                <div key={fb.id} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="text-sm text-white font-medium">{fb.user_email}</div>
                    <div className="text-xs text-gray-400">{format(new Date(fb.created_at), 'MMM d, yyyy h:mm a')}</div>
                  </div>
                  {fb.answers.map((answer, idx) => (
                    <div key={idx} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-gray-300">{answer.question_text}</div>
                        <div className={`text-sm font-semibold px-2 py-1 rounded ${
                          answer.rating >= 8 ? 'bg-emerald-500/20 text-emerald-400' :
                          answer.rating >= 6 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {answer.rating}/10
                        </div>
                      </div>
                      {answer.comment && (
                        <div className="text-sm text-gray-400 italic ml-4">&quot;{answer.comment}&quot;</div>
                      )}
                    </div>
                  ))}
                  {fb.general_feedback && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="text-xs text-gray-400 mb-1">Additional Feedback:</div>
                      <div className="text-sm text-gray-300">{fb.general_feedback}</div>
                    </div>
                  )}
                </div>
              ))}
              {feedback.length === 0 && (
                <div className="text-center py-8 text-gray-400">No feedback submissions yet</div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-6">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-orange-400" />
                  Support Messages ({supportMessages.length})
                </h2>
                <button
                  onClick={() => exportToCSV(supportMessages, 'support-messages')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSupportFilter('all')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    supportFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All ({supportMessages.length})
                </button>
                <button
                  onClick={() => setSupportFilter('bug_report')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    supportFilter === 'bug_report'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Bug Reports ({supportMessages.filter(m => m.support_type === 'bug_report').length})
                </button>
                <button
                  onClick={() => setSupportFilter('support_message')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    supportFilter === 'support_message'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Support ({supportMessages.filter(m => m.support_type === 'support_message').length})
                </button>
                <button
                  onClick={() => setSupportFilter('feature_request')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    supportFilter === 'feature_request'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Feature Requests ({supportMessages.filter(m => m.support_type === 'feature_request').length})
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredSupportMessages.map((msg) => (
                <div key={msg.id} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-sm text-white font-medium">{msg.user_email}</div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        msg.support_type === 'bug_report' ? 'bg-red-500/20 text-red-400' :
                        msg.support_type === 'feature_request' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {msg.support_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}</div>
                  </div>
                  {msg.support_details.subject && (
                    <div className="text-sm text-gray-300 font-medium mb-2">{msg.support_details.subject}</div>
                  )}
                  {msg.support_details.description && (
                    <div className="text-sm text-gray-400 mb-2">{msg.support_details.description}</div>
                  )}
                  {msg.support_details.url_context && (
                    <div className="text-xs text-gray-500 mb-2">Page: {msg.support_details.url_context}</div>
                  )}
                  {msg.attachment_urls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <div className="text-xs text-gray-400">
                        {msg.attachment_urls.length} attachment{msg.attachment_urls.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredSupportMessages.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  {supportMessages.length === 0 ? 'No support messages yet' : 'No messages in this category'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail View Modal */}
      {detailView && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setDetailView(null)}>
          <div
            className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {detailView === 'users' && 'User Details'}
                {detailView === 'teams' && 'Team Details'}
                {detailView === 'documents' && 'Document Details'}
                {detailView === 'chats' && 'Chat Details'}
              </h3>
              <button
                onClick={() => setDetailView(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {detailView === 'teams' && (
              <div className="space-y-4">
                {teamsData.map((team) => (
                  <div key={team.id} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-lg font-semibold text-white">{team.name}</div>
                      <div className="text-sm text-gray-400">
                        {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Created: {format(new Date(team.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailView === 'users' && (
              <div className="text-gray-300">
                <p className="mb-4">Total Users: {users.length}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</div>
                    <div className="text-sm text-gray-400">Admins</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">{users.filter(u => u.gmail_connected).length}</div>
                    <div className="text-sm text-gray-400">Gmail Connected</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">{users.filter(u => u.drive_connected).length}</div>
                    <div className="text-sm text-gray-400">Drive Connected</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">{users.filter(u => u.documents_synced).length}</div>
                    <div className="text-sm text-gray-400">Documents Synced</div>
                  </div>
                </div>
              </div>
            )}

            {detailView === 'documents' && overviewMetrics && (
              <div className="text-gray-300">
                <p className="mb-4">Total Documents: {overviewMetrics.totalDocuments}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">
                      {users.reduce((sum, u) => sum + u.strategy_docs_count, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Strategy Docs</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">
                      {users.reduce((sum, u) => sum + u.meeting_docs_count, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Meeting Docs</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">
                      {users.reduce((sum, u) => sum + u.financial_docs_count, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Financial Docs</div>
                  </div>
                </div>
              </div>
            )}

            {detailView === 'chats' && overviewMetrics && (
              <div className="text-gray-300">
                <p className="mb-4">Total Messages: {overviewMetrics.totalChats}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">
                      {users.reduce((sum, u) => sum + u.private_chats_count, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Private Chats</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">
                      {users.reduce((sum, u) => sum + u.team_messages_count, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Team Messages</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
