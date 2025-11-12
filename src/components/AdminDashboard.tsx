import React, { useState, useEffect } from 'react';
import {
  Users, Building2, FileText, MessageSquare, BarChart3, Download,
  Calendar, TrendingUp, Mail, HardDrive, Clock, AlertCircle,
  CheckCircle, XCircle, Filter, Search, ArrowUpDown, MessageCircleQuestion
} from 'lucide-react';
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
  question_1_answer: string;
  question_2_answer: string;
  question_3_answer: string;
  general_feedback: string;
  feedback_type: string;
}

interface SupportMessage {
  id: string;
  user_email: string;
  created_at: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  category: string;
}

type TimeFilter = '7days' | '30days' | '90days' | 'all';
type SortField = 'email' | 'created_at' | 'team_name' | 'documents' | 'messages';
type SortDirection = 'asc' | 'desc';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics | null>(null);
  const [users, setUsers] = useState<UserMetric[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    loadAllMetrics();
  }, [timeFilter]);

  const loadAllMetrics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOverviewMetrics(),
        loadUserMetrics(),
        loadFeedback(),
        loadSupportMessages()
      ]);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewMetrics = async () => {
    try {
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: totalTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

      const { count: strategyDocs } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });

      const { count: meetingDocs } = await supabase
        .from('document_chunks_meeting')
        .select('*', { count: 'exact', head: true });

      const { count: financialDocs } = await supabase
        .from('document_chunks_financial')
        .select('*', { count: 'exact', head: true });

      const { count: privateChats } = await supabase
        .from('astra_chats')
        .select('*', { count: 'exact', head: true });

      const { count: teamChats } = await supabase
        .from('astra_team_chats')
        .select('*', { count: 'exact', head: true });

      const { count: reports } = await supabase
        .from('user_reports')
        .select('*', { count: 'exact', head: true });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: active7Days } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', sevenDaysAgo.toISOString());

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: active30Days } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString());

      setOverviewMetrics({
        totalUsers: totalUsers || 0,
        totalTeams: totalTeams || 0,
        totalDocuments: (strategyDocs || 0) + (meetingDocs || 0) + (financialDocs || 0),
        totalChats: (privateChats || 0) + (teamChats || 0),
        totalReports: reports || 0,
        activeUsersLast7Days: active7Days || 0,
        activeUsersLast30Days: active30Days || 0
      });
    } catch (error) {
      console.error('Error loading overview metrics:', error);
    }
  };

  const loadUserMetrics = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          created_at,
          team_id,
          role,
          last_sign_in_at
        `)
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
          { data: strategyDocs },
          { data: meetingDocs },
          { data: financialDocs },
          { count: reports },
          { data: gmailAuth },
          { data: driveConn }
        ] = await Promise.all([
          supabase.from('astra_chats').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('astra_team_messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('documents').select('id').eq('team_id', user.team_id).eq('folder_type', 'strategy'),
          supabase.from('documents').select('id').eq('team_id', user.team_id).eq('folder_type', 'meeting'),
          supabase.from('documents').select('id').eq('team_id', user.team_id).eq('folder_type', 'financial'),
          supabase.from('user_reports').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('gmail_auth').select('is_active').eq('user_id', user.id).maybeSingle(),
          supabase.from('user_drive_connections').select('is_active').eq('user_id', user.id).maybeSingle()
        ]);

        const strategyCount = strategyDocs?.length || 0;
        const meetingCount = meetingDocs?.length || 0;
        const financialCount = financialDocs?.length || 0;
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
      const { data, error } = await supabase
        .from('feedback_submissions')
        .select(`
          id,
          user_id,
          created_at,
          question_1_answer,
          question_2_answer,
          question_3_answer,
          general_feedback,
          feedback_type
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedFeedback = await Promise.all((data || []).map(async (fb) => {
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', fb.user_id)
          .maybeSingle();

        return {
          ...fb,
          user_email: userData?.email || 'Unknown'
        };
      }));

      setFeedback(enrichedFeedback);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const loadSupportMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback_submissions')
        .select(`
          id,
          user_id,
          created_at,
          support_subject,
          support_message,
          support_priority,
          support_status,
          support_category
        `)
        .not('support_message', 'is', null)
        .order('created_at', { ascending: false });

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
          created_at: msg.created_at,
          subject: msg.support_subject || 'No Subject',
          message: msg.support_message,
          priority: msg.support_priority || 'medium',
          status: msg.support_status || 'open',
          category: msg.support_category || 'general'
        };
      }));

      setSupportMessages(enrichedSupport);
    } catch (error) {
      console.error('Error loading support messages:', error);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Comprehensive metrics and analytics for AI Rocket</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Overview Cards */}
        {overviewMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-400" />
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{overviewMetrics.totalUsers}</div>
              <div className="text-sm text-gray-400">Total Users</div>
              <div className="mt-2 text-xs text-gray-500">
                Active: {overviewMetrics.activeUsersLast7Days} (7d) / {overviewMetrics.activeUsersLast30Days} (30d)
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Building2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{overviewMetrics.totalTeams}</div>
              <div className="text-sm text-gray-400">Total Teams</div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{overviewMetrics.totalDocuments}</div>
              <div className="text-sm text-gray-400">Total Documents</div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="w-8 h-8 text-orange-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{overviewMetrics.totalChats}</div>
              <div className="text-sm text-gray-400">Total Chats</div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" />
              User Metrics
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => exportToCSV(filteredAndSortedUsers, 'user-metrics')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => handleSort('team_name')}
                  >
                    <div className="flex items-center gap-2">
                      Team
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Joined
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Last Active</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Documents</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Messages</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Reports</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Integrations</th>
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
                    <td className="py-3 px-4 text-sm text-gray-300">{user.team_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
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

        {/* Feedback Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <MessageCircleQuestion className="w-6 h-6 text-purple-400" />
              User Feedback ({feedback.length})
            </h2>
            <button
              onClick={() => exportToCSV(feedback, 'user-feedback')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {feedback.map((fb) => (
              <div key={fb.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-white font-medium">{fb.user_email}</div>
                  <div className="text-xs text-gray-400">{format(new Date(fb.created_at), 'MMM d, yyyy h:mm a')}</div>
                </div>
                {fb.feedback_type && (
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      {fb.feedback_type}
                    </span>
                  </div>
                )}
                {fb.question_1_answer && (
                  <div className="text-sm text-gray-300 mb-2">
                    <span className="text-gray-400">Q1:</span> {fb.question_1_answer}
                  </div>
                )}
                {fb.question_2_answer && (
                  <div className="text-sm text-gray-300 mb-2">
                    <span className="text-gray-400">Q2:</span> {fb.question_2_answer}
                  </div>
                )}
                {fb.question_3_answer && (
                  <div className="text-sm text-gray-300 mb-2">
                    <span className="text-gray-400">Q3:</span> {fb.question_3_answer}
                  </div>
                )}
                {fb.general_feedback && (
                  <div className="text-sm text-gray-300 mt-2 pt-2 border-t border-gray-600">
                    <span className="text-gray-400">Additional Feedback:</span> {fb.general_feedback}
                  </div>
                )}
              </div>
            ))}
            {feedback.length === 0 && (
              <div className="text-center py-8 text-gray-400">No feedback submissions yet</div>
            )}
          </div>
        </div>

        {/* Support Messages Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-400" />
              Support Messages ({supportMessages.length})
            </h2>
            <button
              onClick={() => exportToCSV(supportMessages, 'support-messages')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {supportMessages.map((msg) => (
              <div key={msg.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-white font-medium">{msg.user_email}</div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      msg.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      msg.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {msg.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      msg.status === 'open' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {msg.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}</div>
                </div>
                <div className="text-sm text-gray-300 font-medium mb-2">{msg.subject}</div>
                <div className="text-sm text-gray-400">{msg.message}</div>
                <div className="mt-2 text-xs text-gray-500">Category: {msg.category}</div>
              </div>
            ))}
            {supportMessages.length === 0 && (
              <div className="text-center py-8 text-gray-400">No support messages yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
