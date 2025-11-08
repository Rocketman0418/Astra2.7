import { useState, useEffect } from 'react';
import { MessageSquare, TrendingUp, TrendingDown, Minus, Download, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackStats {
  totalSubmissions: number;
  avgRatings: Record<string, number>;
  recentSuggestions: Array<{
    id: string;
    user_name: string;
    submitted_at: string;
    question_text: string;
    rating: number;
    comment: string;
  }>;
}

export function FeedbackAnalyticsPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'all'>('7days');

  const isAdmin = user?.user_metadata?.role === 'admin';
  const teamId = user?.user_metadata?.team_id;

  useEffect(() => {
    if (isAdmin && teamId) {
      loadFeedbackStats();
    }
  }, [isAdmin, teamId, dateRange]);

  const loadFeedbackStats = async () => {
    if (!teamId) return;

    try {
      setLoading(true);
      setError('');

      let dateFilter = '';
      const now = new Date();

      if (dateRange === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = sevenDaysAgo.toISOString();
      } else if (dateRange === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = thirtyDaysAgo.toISOString();
      }

      let query = supabase
        .from('user_feedback_submissions')
        .select(`
          id,
          submitted_at,
          users!inner(id, raw_user_meta_data)
        `)
        .eq('team_id', teamId);

      if (dateFilter) {
        query = query.gte('submitted_at', dateFilter);
      }

      const { data: submissions, error: submissionsError } = await query;

      if (submissionsError) {
        if (submissionsError.code === '42P01') {
          console.warn('Feedback tables not yet created');
          setLoading(false);
          return;
        }
        throw submissionsError;
      }

      let answersQuery = supabase
        .from('user_feedback_answers')
        .select(`
          id,
          rating,
          comment,
          submission_id,
          user_feedback_submissions!inner(submitted_at, team_id, user_id, users(raw_user_meta_data)),
          feedback_questions(question_text, category)
        `)
        .eq('user_feedback_submissions.team_id', teamId);

      if (dateFilter) {
        answersQuery = answersQuery.gte('user_feedback_submissions.submitted_at', dateFilter);
      }

      const { data: answers, error: answersError } = await answersQuery;

      if (answersError) {
        if (answersError.code === '42P01') {
          console.warn('Feedback tables not yet created');
          setLoading(false);
          return;
        }
        throw answersError;
      }

      const questionStats: Record<string, { total: number; sum: number }> = {};
      answers?.forEach(answer => {
        const questionText = answer.feedback_questions?.question_text || 'Unknown';
        if (!questionStats[questionText]) {
          questionStats[questionText] = { total: 0, sum: 0 };
        }
        questionStats[questionText].total += 1;
        questionStats[questionText].sum += answer.rating;
      });

      const avgRatings: Record<string, number> = {};
      Object.entries(questionStats).forEach(([question, stats]) => {
        avgRatings[question] = stats.sum / stats.total;
      });

      const recentSuggestions = answers
        ?.filter(a => a.comment && a.comment.trim() !== '')
        .slice(0, 20)
        .map(a => ({
          id: a.id,
          user_name: a.user_feedback_submissions?.users?.raw_user_meta_data?.name || 'Anonymous',
          submitted_at: a.user_feedback_submissions?.submitted_at || '',
          question_text: a.feedback_questions?.question_text || '',
          rating: a.rating,
          comment: a.comment || ''
        })) || [];

      setStats({
        totalSubmissions: submissions?.length || 0,
        avgRatings,
        recentSuggestions
      });

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading feedback stats:', err);
      setError(err.message || 'Failed to load feedback data');
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!stats) return;

    const csvRows: string[] = [];
    csvRows.push('User,Date,Question,Rating,Comment');

    stats.recentSuggestions.forEach(item => {
      const row = [
        item.user_name,
        new Date(item.submitted_at).toLocaleDateString(),
        `"${item.question_text}"`,
        item.rating.toString(),
        `"${item.comment.replace(/"/g, '""')}"`
      ].join(',');
      csvRows.push(row);
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isAdmin) return null;

  const getTrendIcon = (rating: number) => {
    if (rating >= 8) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (rating >= 6) return <Minus className="w-4 h-4 text-yellow-400" />;
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-400';
    if (rating >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Team Feedback Analytics</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={exportToCSV}
            disabled={!stats || stats.recentSuggestions.length === 0}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!loading && stats && (
        <>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-400">Total Submissions</p>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalSubmissions}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-400">Comments Received</p>
              </div>
              <p className="text-3xl font-bold text-white">{stats.recentSuggestions.length}</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-white font-semibold mb-3">Average Ratings by Question</h4>
            <div className="space-y-3">
              {Object.entries(stats.avgRatings).map(([question, rating]) => (
                <div key={question} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-gray-300 flex-1">{question}</p>
                    <div className="flex items-center space-x-2 ml-3">
                      {getTrendIcon(rating)}
                      <span className={`text-lg font-bold ${getRatingColor(rating)}`}>
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        rating >= 8 ? 'bg-green-500' : rating >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(rating / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {stats.recentSuggestions.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3">Recent Comments & Suggestions</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.recentSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-white">{suggestion.user_name}</p>
                        <span className="text-xs text-gray-500">•</span>
                        <p className="text-xs text-gray-500">
                          {new Date(suggestion.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${getRatingColor(suggestion.rating)}`}>
                        {suggestion.rating}/10
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{suggestion.question_text}</p>
                    <p className="text-sm text-gray-300">{suggestion.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.recentSuggestions.length === 0 && stats.totalSubmissions > 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No comments received yet</p>
            </div>
          )}

          {stats.totalSubmissions === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No feedback submissions yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Team members will start receiving feedback prompts 24 hours after onboarding
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
