import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  FileText,
  Image,
  Clock,
  AlertCircle,
  Award,
  Activity,
  Zap,
  Calendar,
  HelpCircle
} from 'lucide-react';
import { MetricsAskAstra } from './MetricsAskAstra';

interface MetricsOverview {
  totalUsers: number;
  activeUsersToday: number;
  activeUsers7Days: number;
  activeUsers30Days: number;
  totalMessages: number;
  totalReports: number;
  totalVisualizations: number;
  avgResponseTime: number;
  errorRate: number;
}

interface DailyMetric {
  metric_date: string;
  daily_active_users: number;
  total_messages: number;
  total_reports: number;
  total_visualizations: number;
}

interface MilestoneStats {
  milestone_type: string;
  users_achieved: number;
  achievement_rate_pct: number;
}

interface PerformanceStats {
  date: string;
  mode: string;
  avg_response_ms: number;
  success_rate: number;
  total_requests: number;
}

export const UserMetricsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [milestones, setMilestones] = useState<MilestoneStats[]>([]);
  const [performance, setPerformance] = useState<PerformanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'performance' | 'milestones' | 'guide' | 'ask-astra'>('overview');
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    if (user) {
      fetchAllMetrics();
    }
  }, [user, timeRange]);

  const fetchAllMetrics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverviewMetrics(),
        fetchDailyMetrics(),
        fetchMilestoneStats(),
        fetchPerformanceStats()
      ]);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverviewMetrics = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Active users today
    const today = new Date().toISOString().split('T')[0];
    const { data: activeToday } = await supabase
      .from('user_metrics_daily')
      .select('user_id')
      .eq('metric_date', today);

    // Active users last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: active7Days } = await supabase
      .from('user_metrics_daily')
      .select('user_id')
      .gte('metric_date', sevenDaysAgo.toISOString().split('T')[0]);

    // Active users last 30 days
    const { data: active30Days } = await supabase
      .from('user_metrics_daily')
      .select('user_id')
      .gte('metric_date', startDate.toISOString().split('T')[0]);

    // Total activity metrics
    const { data: activityData } = await supabase
      .from('user_metrics_daily')
      .select('messages_sent, reports_generated, visualizations_created')
      .gte('metric_date', startDate.toISOString().split('T')[0]);

    // Performance metrics
    const { data: perfData } = await supabase
      .from('astra_performance_logs')
      .select('response_time_ms, success')
      .gte('created_at', startDate.toISOString());

    const totalMessages = activityData?.reduce((sum, d) => sum + (d.messages_sent || 0), 0) || 0;
    const totalReports = activityData?.reduce((sum, d) => sum + (d.reports_generated || 0), 0) || 0;
    const totalVisualizations = activityData?.reduce((sum, d) => sum + (d.visualizations_created || 0), 0) || 0;

    const avgResponseTime = perfData?.length
      ? Math.round(perfData.reduce((sum, p) => sum + p.response_time_ms, 0) / perfData.length)
      : 0;

    const errorRate = perfData?.length
      ? Math.round((perfData.filter(p => !p.success).length / perfData.length) * 100)
      : 0;

    setOverview({
      totalUsers: totalUsers || 0,
      activeUsersToday: new Set(activeToday?.map(d => d.user_id)).size,
      activeUsers7Days: new Set(active7Days?.map(d => d.user_id)).size,
      activeUsers30Days: new Set(active30Days?.map(d => d.user_id)).size,
      totalMessages,
      totalReports,
      totalVisualizations,
      avgResponseTime,
      errorRate
    });
  };

  const fetchDailyMetrics = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const { data } = await supabase.rpc('get_daily_metrics_aggregated', {
      p_start_date: startDate.toISOString().split('T')[0],
      p_end_date: new Date().toISOString().split('T')[0]
    });

    if (data) {
      setDailyMetrics(data);
    } else {
      // Fallback manual aggregation
      const { data: rawData } = await supabase
        .from('user_metrics_daily')
        .select('metric_date, messages_sent, reports_generated, visualizations_created, user_id')
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (rawData) {
        const aggregated: { [key: string]: DailyMetric } = {};
        rawData.forEach(row => {
          if (!aggregated[row.metric_date]) {
            aggregated[row.metric_date] = {
              metric_date: row.metric_date,
              daily_active_users: 0,
              total_messages: 0,
              total_reports: 0,
              total_visualizations: 0
            };
          }
          aggregated[row.metric_date].daily_active_users++;
          aggregated[row.metric_date].total_messages += row.messages_sent || 0;
          aggregated[row.metric_date].total_reports += row.reports_generated || 0;
          aggregated[row.metric_date].total_visualizations += row.visualizations_created || 0;
        });
        setDailyMetrics(Object.values(aggregated));
      }
    }
  };

  const fetchMilestoneStats = async () => {
    const { data: totalUsersData } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    const { data } = await supabase
      .from('user_milestones')
      .select('milestone_type');

    if (data) {
      const stats: { [key: string]: number } = {};
      data.forEach(m => {
        stats[m.milestone_type] = (stats[m.milestone_type] || 0) + 1;
      });

      const totalUsers = totalUsersData || 0;
      const milestoneStats = Object.entries(stats).map(([type, count]) => ({
        milestone_type: type,
        users_achieved: count,
        achievement_rate_pct: totalUsers ? Math.round((count / (totalUsers as any)) * 100) : 0
      }));

      setMilestones(milestoneStats);
    }
  };

  const fetchPerformanceStats = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const { data } = await supabase
      .from('astra_performance_logs')
      .select('created_at, mode, response_time_ms, success')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (data) {
      const grouped: { [key: string]: { times: number[], successes: number, total: number } } = {};

      data.forEach(log => {
        const date = log.created_at.split('T')[0];
        const key = `${date}-${log.mode}`;
        if (!grouped[key]) {
          grouped[key] = { times: [], successes: 0, total: 0 };
        }
        grouped[key].times.push(log.response_time_ms);
        if (log.success) grouped[key].successes++;
        grouped[key].total++;
      });

      const perfStats = Object.entries(grouped).map(([key, val]) => {
        const [date, mode] = key.split('-');
        return {
          date,
          mode,
          avg_response_ms: Math.round(val.times.reduce((a, b) => a + b, 0) / val.times.length),
          success_rate: Math.round((val.successes / val.total) * 100),
          total_requests: val.total
        };
      });

      setPerformance(perfStats);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading metrics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-green-500 to-blue-500 text-transparent bg-clip-text">
                User Metrics Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">Comprehensive analytics and insights</p>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value) as 7 | 30 | 90)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
              </select>

              <button
                onClick={fetchAllMetrics}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'engagement', label: 'Engagement', icon: TrendingUp },
              { id: 'performance', label: 'Performance', icon: Zap },
              { id: 'milestones', label: 'Milestones', icon: Award },
              { id: 'guide', label: 'Guide', icon: HelpCircle },
              { id: 'ask-astra', label: 'Ask Astra', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Users"
                value={formatNumber(overview.totalUsers)}
                iconColor="text-blue-500"
              />
              <StatCard
                icon={Users}
                label="Active Today"
                value={formatNumber(overview.activeUsersToday)}
                subtitle={`${overview.activeUsers7Days} (7d) · ${overview.activeUsers30Days} (30d)`}
                iconColor="text-green-500"
              />
              <StatCard
                icon={MessageSquare}
                label="Messages Sent"
                value={formatNumber(overview.totalMessages)}
                iconColor="text-orange-500"
              />
              <StatCard
                icon={FileText}
                label="Reports Generated"
                value={formatNumber(overview.totalReports)}
                iconColor="text-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                icon={Image}
                label="Visualizations"
                value={formatNumber(overview.totalVisualizations)}
                iconColor="text-cyan-500"
              />
              <StatCard
                icon={Clock}
                label="Avg Response Time"
                value={`${formatNumber(overview.avgResponseTime)}ms`}
                iconColor="text-yellow-500"
              />
              <StatCard
                icon={AlertCircle}
                label="Error Rate"
                value={`${overview.errorRate}%`}
                iconColor={overview.errorRate > 5 ? 'text-red-500' : 'text-green-500'}
              />
            </div>

            {/* Daily Activity Chart */}
            {dailyMetrics.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  Daily Active Users
                </h2>
                <div className="h-64 flex items-end gap-2">
                  {dailyMetrics.slice(-timeRange).map((day, idx) => {
                    const maxUsers = Math.max(...dailyMetrics.map(d => d.daily_active_users));
                    const height = maxUsers > 0 ? (day.daily_active_users / maxUsers) * 100 : 0;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="text-xs text-gray-500 font-medium">{day.daily_active_users}</div>
                        <div
                          className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all hover:from-orange-400 hover:to-orange-300"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                          title={`${day.daily_active_users} users on ${formatDate(day.metric_date)}`}
                        ></div>
                        <div className="text-xs text-gray-600">{formatDate(day.metric_date)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'engagement' && (
          <EngagementTab dailyMetrics={dailyMetrics} formatNumber={formatNumber} formatDate={formatDate} />
        )}

        {activeTab === 'performance' && (
          <PerformanceTab performance={performance} formatNumber={formatNumber} formatDate={formatDate} />
        )}

        {activeTab === 'milestones' && (
          <MilestonesTab milestones={milestones} formatNumber={formatNumber} />
        )}

        {activeTab === 'guide' && (
          <GuideTab />
        )}

        {activeTab === 'ask-astra' && (
          <MetricsAskAstra
            metricsData={{
              overview,
              dailyMetrics,
              milestones,
              performance,
              timeRange
            }}
          />
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  iconColor: string;
}> = ({ icon: Icon, label, value, subtitle, iconColor }) => (
  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-gray-900 ${iconColor}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

// Engagement Tab Component
const EngagementTab: React.FC<{
  dailyMetrics: DailyMetric[];
  formatNumber: (n: number) => string;
  formatDate: (d: string) => string;
}> = ({ dailyMetrics, formatNumber, formatDate }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <MetricChart
        title="Messages Sent"
        data={dailyMetrics}
        dataKey="total_messages"
        color="from-orange-500 to-orange-400"
        formatNumber={formatNumber}
        formatDate={formatDate}
      />
      <MetricChart
        title="Reports Generated"
        data={dailyMetrics}
        dataKey="total_reports"
        color="from-purple-500 to-purple-400"
        formatNumber={formatNumber}
        formatDate={formatDate}
      />
      <MetricChart
        title="Visualizations Created"
        data={dailyMetrics}
        dataKey="total_visualizations"
        color="from-cyan-500 to-cyan-400"
        formatNumber={formatNumber}
        formatDate={formatDate}
      />
    </div>
  </div>
);

// Performance Tab Component
const PerformanceTab: React.FC<{
  performance: PerformanceStats[];
  formatNumber: (n: number) => string;
  formatDate: (d: string) => string;
}> = ({ performance, formatNumber, formatDate }) => (
  <div className="space-y-6">
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Response Times by Mode</h2>
      <div className="space-y-4">
        {['chat', 'reports', 'visualization'].map(mode => {
          const modeData = performance.filter(p => p.mode === mode);
          const avgTime = modeData.length > 0
            ? Math.round(modeData.reduce((sum, p) => sum + p.avg_response_ms, 0) / modeData.length)
            : 0;
          const avgSuccess = modeData.length > 0
            ? Math.round(modeData.reduce((sum, p) => sum + p.success_rate, 0) / modeData.length)
            : 0;

          return (
            <div key={mode} className="p-4 bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{mode}</span>
                <span className="text-sm text-gray-400">{formatNumber(avgTime)}ms avg</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
                  style={{ width: `${avgSuccess}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{avgSuccess}% success rate</div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// Milestones Tab Component
const MilestonesTab: React.FC<{
  milestones: MilestoneStats[];
  formatNumber: (n: number) => string;
}> = ({ milestones, formatNumber }) => (
  <div className="space-y-6">
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-orange-500" />
        Milestone Achievement Rates
      </h2>
      <div className="space-y-4">
        {milestones.sort((a, b) => b.users_achieved - a.users_achieved).map((milestone, idx) => (
          <div key={idx} className="p-4 bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium capitalize">{milestone.milestone_type.replace(/_/g, ' ')}</span>
              <span className="text-sm text-gray-400">
                {formatNumber(milestone.users_achieved)} users ({milestone.achievement_rate_pct}%)
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full"
                style={{ width: `${milestone.achievement_rate_pct}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Guide Tab Component
const GuideTab: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-blue-500 text-transparent bg-clip-text">
        User Metrics Tracking Guide
      </h2>

      <div className="prose prose-invert max-w-none">
        <h3 className="text-xl font-semibold text-white mb-3">📊 What's Being Tracked</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-500 mb-2">Daily Metrics</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Messages sent per user</li>
              <li>• Reports generated</li>
              <li>• Visualizations created</li>
              <li>• Session count & duration</li>
              <li>• Error count</li>
            </ul>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h4 className="font-semibold text-green-500 mb-2">Milestones</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• First message sent</li>
              <li>• First report created</li>
              <li>• First visualization saved</li>
              <li>• Gmail connected</li>
              <li>• Drive connected</li>
            </ul>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-3">🚀 Key Features</h3>
        <ul className="text-gray-300 space-y-2 mb-6">
          <li><strong className="text-orange-500">Batched Writes:</strong> Metrics are queued and written in batches (10 events or 60 seconds)</li>
          <li><strong className="text-green-500">Non-Blocking:</strong> All tracking happens asynchronously without slowing down the UI</li>
          <li><strong className="text-blue-500">Mobile-Optimized:</strong> Handles app backgrounding and session lifecycle correctly</li>
          <li><strong className="text-purple-500">Performance Tracking:</strong> AI response times and error rates monitored</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-3">📈 Benefits</h3>
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-lg mb-6">
          <ul className="text-gray-300 space-y-2">
            <li>✅ <strong>10-100x faster</strong> dashboard queries using pre-aggregated data</li>
            <li>✅ <strong>Real-time insights</strong> into user engagement and behavior</li>
            <li>✅ <strong>Onboarding optimization</strong> with time-to-value metrics</li>
            <li>✅ <strong>SLA monitoring</strong> for AI response times</li>
            <li>✅ <strong>Data-driven decisions</strong> with comprehensive analytics</li>
          </ul>
        </div>

        <h3 className="text-xl font-semibold text-white mb-3">🔍 How to Use This Dashboard</h3>
        <ol className="text-gray-300 space-y-2">
          <li><strong>Overview:</strong> High-level stats and daily activity trends</li>
          <li><strong>Engagement:</strong> Detailed charts for messages, reports, and visualizations</li>
          <li><strong>Performance:</strong> AI response times and success rates by mode</li>
          <li><strong>Milestones:</strong> User achievement rates and adoption metrics</li>
          <li><strong>Ask Astra:</strong> Query metrics using natural language</li>
        </ol>
      </div>
    </div>
  </div>
);

// Metric Chart Component
const MetricChart: React.FC<{
  title: string;
  data: DailyMetric[];
  dataKey: keyof DailyMetric;
  color: string;
  formatNumber: (n: number) => string;
  formatDate: (d: string) => string;
}> = ({ title, data, dataKey, color, formatNumber, formatDate }) => {
  const values = data.map(d => d[dataKey] as number);
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, v) => sum + v, 0);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-2xl font-bold mb-4">{formatNumber(total)}</p>
      <div className="h-32 flex items-end gap-1">
        {data.slice(-14).map((day, idx) => {
          const value = day[dataKey] as number;
          const height = max > 0 ? (value / max) * 100 : 0;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full bg-gradient-to-t ${color} rounded-t-lg transition-all`}
                style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0px' }}
                title={`${value} on ${formatDate(day.metric_date)}`}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
