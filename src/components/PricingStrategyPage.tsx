import React, { useState } from 'react';
import { DollarSign, TrendingUp, Users, Calculator, Zap, Crown, Target, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';

interface PricingScenario {
  name: string;
  description: string;
  priority: 'profitability' | 'growth' | 'balanced';
  signups: number;
  conversionRate: number;
  avgRevenue: number;
  churnRate: number;
  cac: number;
  costPerFreeUser: number;
}

interface CalculatorInputs {
  monthlySignups: number;
  conversionRate: number;
  proPricing: number;
  additionalSeatPrice: number;
  avgSeatsPerTeam: number;
  churnRate: number;
  costPerFreeUser: number;
  costPerProUser: number;
  proConversionTime: number;
}

export const PricingStrategyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recommended' | 'calculator' | 'comparison' | 'ask-astra'>('recommended');
  const [showAskAstra, setShowAskAstra] = useState(false);

  const [inputs, setInputs] = useState<CalculatorInputs>({
    monthlySignups: 100,
    conversionRate: 25,
    proPricing: 99,
    additionalSeatPrice: 29,
    avgSeatsPerTeam: 2.5,
    churnRate: 5,
    costPerFreeUser: 2,
    costPerProUser: 15,
    proConversionTime: 14
  });

  const calculateProjections = (scenario: Partial<CalculatorInputs> = {}) => {
    const calc = { ...inputs, ...scenario };

    const signupsPerMonth = calc.monthlySignups;
    const conversionRate = calc.conversionRate / 100;
    const churnRate = calc.churnRate / 100;

    let month1 = {
      signups: signupsPerMonth,
      freeUsers: signupsPerMonth,
      proUsers: 0,
      revenue: 0,
      costs: signupsPerMonth * calc.costPerFreeUser,
      profit: -(signupsPerMonth * calc.costPerFreeUser)
    };

    let month3 = {
      signups: signupsPerMonth * 3,
      freeUsers: 0,
      proUsers: 0,
      revenue: 0,
      costs: 0,
      profit: 0
    };

    let month12 = {
      signups: signupsPerMonth * 12,
      freeUsers: 0,
      proUsers: 0,
      revenue: 0,
      costs: 0,
      profit: 0
    };

    // Month 3 calculations
    const conversionsMonth3 = (signupsPerMonth * 3) * conversionRate;
    const retainedProUsers3 = conversionsMonth3 * (1 - churnRate);
    month3.proUsers = retainedProUsers3;
    month3.freeUsers = (signupsPerMonth * 3) - conversionsMonth3;
    month3.revenue = retainedProUsers3 * calc.proPricing +
                    (retainedProUsers3 * (calc.avgSeatsPerTeam - 1) * calc.additionalSeatPrice);
    month3.costs = (month3.freeUsers * calc.costPerFreeUser) +
                   (month3.proUsers * calc.costPerProUser);
    month3.profit = month3.revenue - month3.costs;

    // Month 12 calculations
    const conversionsMonth12 = (signupsPerMonth * 12) * conversionRate;
    const avgChurnOver12Months = Math.pow(1 - churnRate, 12);
    const retainedProUsers12 = conversionsMonth12 * avgChurnOver12Months;
    month12.proUsers = retainedProUsers12;
    month12.freeUsers = (signupsPerMonth * 12) - conversionsMonth12;
    month12.revenue = retainedProUsers12 * calc.proPricing +
                     (retainedProUsers12 * (calc.avgSeatsPerTeam - 1) * calc.additionalSeatPrice);
    month12.costs = (month12.freeUsers * calc.costPerFreeUser) +
                    (month12.proUsers * calc.costPerProUser);
    month12.profit = month12.revenue - month12.costs;

    return {
      month1,
      month3,
      month12,
      mrr3: month3.revenue,
      mrr12: month12.revenue,
      arr12: month12.revenue * 12,
      ltv: (calc.proPricing * 12) / churnRate,
      paybackPeriod: calc.costPerFreeUser / (calc.proPricing * conversionRate)
    };
  };

  const topStrategies = [
    {
      rank: 1,
      name: "14-Day Paid Trial",
      badge: "🏆 Best for Profitability",
      tagline: "Credit card required upfront",
      priority: "Maximum profitability with qualified leads",

      structure: {
        trial: "14 days - All features unlocked",
        pricing: "$99/month Pro (3 seats) + $29/seat",
        commitment: "Credit card required at signup"
      },

      features: {
        trialAccess: "Full access to everything for 14 days",
        limits: "No limits during trial",
        teamSeats: "3 seats included, add more at $29/seat",
        cancelation: "Cancel anytime during trial - no charge"
      },

      projections: calculateProjections({
        monthlySignups: 40, // Lower signups (credit card friction)
        conversionRate: 45, // Higher conversion (qualified leads)
        costPerFreeUser: 0 // No free users
      }),

      pros: [
        "Highest conversion rate (40-50%) - only serious users sign up",
        "Zero free users = Zero ongoing costs for non-payers",
        "Fastest path to profitability (Month 2-3)",
        "High-quality leads = Lower churn",
        "Clean revenue model - everyone pays or leaves",
        "No limit management complexity"
      ],

      cons: [
        "Lower signup volume (50-70% drop vs no credit card)",
        "Higher perceived friction at signup",
        "Requires strong value proposition upfront",
        "May lose cautious but valuable users",
        "Need excellent onboarding to prove value fast"
      ],

      implementation: [
        "Use Stripe Trial Period (14 days before first charge)",
        "Email reminders: Day 1, 7, 12, 14",
        "Onboarding must show value within 7 days",
        "Clear cancellation process",
        "Usage tracking during trial to prevent abuse"
      ],

      bestFor: "Your current situation - Need profitability fast with fewer but paying users",

      keyMetrics: {
        profitabilityScore: 95,
        growthScore: 60,
        complexityScore: 20
      }
    },

    {
      rank: 2,
      name: "14-Day Free Trial + Mandatory Upgrade",
      badge: "🥈 Balanced Approach",
      tagline: "No credit card, but must decide in 14 days",
      priority: "Balance signup volume with conversion pressure",

      structure: {
        trial: "14 days - All features unlocked",
        pricing: "$99/month Pro after trial (required)",
        commitment: "No credit card until day 14"
      },

      features: {
        trialAccess: "Full access to everything for 14 days",
        limits: "No limits during trial",
        postTrial: "Must upgrade to Pro or lose access",
        teamSeats: "3 seats included in Pro"
      },

      projections: calculateProjections({
        monthlySignups: 120, // Higher signups (no credit card)
        conversionRate: 18, // Lower conversion (less commitment)
        costPerFreeUser: 3 // Trial costs
      }),

      pros: [
        "Higher signups than paid trial (no credit card barrier)",
        "Time pressure drives decisions (14-day deadline)",
        "All users experience full value",
        "No ongoing free tier costs",
        "Simpler than managing limits",
        "Clear upgrade moment"
      ],

      cons: [
        "Lower conversion than paid trial (18-25%)",
        "14 days may not be enough for some users",
        "Costs during trial period with no guarantee",
        "Loses users who need more time to evaluate",
        "Requires aggressive onboarding"
      ],

      implementation: [
        "Track trial start date in database",
        "Email sequence: Day 1, 7, 11, 13, 14",
        "In-app countdown timer (Days left: X)",
        "Day 14: Force upgrade or lock account",
        "Grace period: 3 days to add payment"
      ],

      bestFor: "When you want more signups than paid trial but still need quick monetization",

      keyMetrics: {
        profitabilityScore: 75,
        growthScore: 80,
        complexityScore: 40
      }
    },

    {
      rank: 3,
      name: "Aggressive Freemium",
      badge: "🥉 Sustainable Growth",
      tagline: "Free forever, but very limited",
      priority: "Long-term user base with strategic monetization",

      structure: {
        free: "1 seat, tight limits on valuable features",
        pricing: "$99/month Pro - 10x better limits",
        commitment: "No time pressure, upgrade when ready"
      },

      features: {
        freeAccess: "Unlimited chat, but limited high-value features",
        limits: "2 reports/week, 1 saved viz, 25 docs, view-only agents",
        proAccess: "20 reports/week, unlimited viz, 500 docs, 5 agents",
        teamSeats: "Free is solo, Pro has 3 seats + add more"
      },

      projections: calculateProjections({
        monthlySignups: 200, // Highest signups (free forever)
        conversionRate: 12, // Lower conversion (no urgency)
        costPerFreeUser: 2.5, // Ongoing free user costs
        proConversionTime: 45 // Takes longer to convert
      }),

      pros: [
        "Highest signup volume (no barrier)",
        "Word of mouth growth from free users",
        "Users can evaluate thoroughly",
        "Lower churn (users are confident before paying)",
        "Viral potential - free users share",
        "Long-term LTV (happy customers)"
      ],

      cons: [
        "Ongoing costs for free users (forever)",
        "Slowest path to profitability (6-12 months)",
        "Lower conversion rate (10-15%)",
        "Complex limit management",
        "Some users stay free forever",
        "Requires tracking and enforcement"
      ],

      implementation: [
        "Track usage per user (reports, viz, docs)",
        "In-app limit displays (2/2 reports used)",
        "Upgrade prompts when hitting limits",
        "Weekly usage summary emails",
        "Limit resets every Monday",
        "Clear upgrade benefits"
      ],

      bestFor: "Building long-term user base when you have runway and patience",

      keyMetrics: {
        profitabilityScore: 55,
        growthScore: 95,
        complexityScore: 80
      }
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-transparent bg-clip-text">
                Pricing Strategy Explorer
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Interactive modeling tool for optimal pricing & monetization
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500">Strategic Goal</div>
                <div className="text-sm font-semibold text-green-500">Profitability First</div>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[
              { id: 'recommended', label: 'Top 3 Strategies', icon: Crown },
              { id: 'calculator', label: 'Scenario Calculator', icon: Calculator },
              { id: 'comparison', label: 'Side-by-Side', icon: TrendingUp },
              { id: 'ask-astra', label: 'Ask Astra', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-green-500 text-white'
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
        {activeTab === 'recommended' && (
          <RecommendedStrategies
            strategies={topStrategies}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}

        {activeTab === 'calculator' && (
          <ScenarioCalculator
            inputs={inputs}
            setInputs={setInputs}
            calculateProjections={calculateProjections}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}

        {activeTab === 'comparison' && (
          <SideBySideComparison
            strategies={topStrategies}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}

        {activeTab === 'ask-astra' && (
          <AskAstraPricing />
        )}
      </div>
    </div>
  );
};

// Recommended Strategies Tab
const RecommendedStrategies: React.FC<{
  strategies: any[];
  formatCurrency: (n: number) => string;
  formatNumber: (n: number) => string;
}> = ({ strategies, formatCurrency, formatNumber }) => (
  <div className="space-y-8">
    {/* Summary Banner */}
    <div className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-gray-700">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-green-500 rounded-lg">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-2">Your Strategic Priority: Profitability First</h2>
          <p className="text-gray-300 mb-4">
            Based on your goal to prioritize profitability over growth, these strategies are ranked
            by their ability to generate revenue quickly with fewer but higher-quality paying users.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-500">45%</div>
              <div className="text-xs text-gray-400">Target Conversion Rate</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-500">2-3 mo</div>
              <div className="text-xs text-gray-400">Time to Profitability</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-500">$99/mo</div>
              <div className="text-xs text-gray-400">Pro Plan Price</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Strategy Cards */}
    {strategies.map((strategy) => (
      <div
        key={strategy.rank}
        className="bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-gray-600 transition-all overflow-hidden"
      >
        {/* Header */}
        <div className={`p-6 ${
          strategy.rank === 1 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20' :
          strategy.rank === 2 ? 'bg-gradient-to-r from-gray-500/20 to-gray-600/20' :
          'bg-gradient-to-r from-orange-500/20 to-red-500/20'
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-3xl font-bold mb-1">#{strategy.rank}</div>
              <h3 className="text-2xl font-bold">{strategy.name}</h3>
              <div className="text-sm text-gray-300 mt-1">{strategy.tagline}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl mb-1">{strategy.badge.split(' ')[0]}</div>
              <div className="text-xs font-semibold text-green-500">
                {strategy.badge.split(' ').slice(1).join(' ')}
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-sm text-gray-300">{strategy.priority}</div>
          </div>
        </div>

        {/* Structure */}
        <div className="p-6 border-b border-gray-700">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Structure
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Trial/Free</div>
              <div className="text-sm text-white">{strategy.structure.trial}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Pricing</div>
              <div className="text-sm text-white">{strategy.structure.pricing}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Commitment</div>
              <div className="text-sm text-white">{strategy.structure.commitment}</div>
            </div>
          </div>
        </div>

        {/* Projections */}
        <div className="p-6 border-b border-gray-700 bg-gray-900/30">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            12-Month Projections
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Total Signups</div>
              <div className="text-xl font-bold text-blue-500">
                {formatNumber(strategy.projections.month12.signups)}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Pro Users</div>
              <div className="text-xl font-bold text-purple-500">
                {formatNumber(strategy.projections.month12.proUsers)}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">MRR (Month 12)</div>
              <div className="text-xl font-bold text-green-500">
                {formatCurrency(strategy.projections.mrr12)}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">ARR</div>
              <div className="text-xl font-bold text-yellow-500">
                {formatCurrency(strategy.projections.arr12)}
              </div>
            </div>
          </div>
        </div>

        {/* Pros & Cons */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-500">
              <CheckCircle className="w-4 h-4" />
              Advantages
            </h4>
            <ul className="space-y-2">
              {strategy.pros.map((pro: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-500">
              <AlertCircle className="w-4 h-4" />
              Considerations
            </h4>
            <ul className="space-y-2">
              {strategy.cons.map((con: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Best For */}
        <div className="p-6 bg-gray-900/50 border-t border-gray-700">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-blue-500 mt-1" />
            <div>
              <div className="font-semibold mb-1">Best For:</div>
              <div className="text-sm text-gray-300">{strategy.bestFor}</div>
            </div>
          </div>
        </div>

        {/* Scores */}
        <div className="p-6 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-2">Profitability</div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${strategy.keyMetrics.profitabilityScore}%` }}
                ></div>
              </div>
              <div className="text-sm font-bold text-green-500 mt-1">
                {strategy.keyMetrics.profitabilityScore}/100
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2">Growth Potential</div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${strategy.keyMetrics.growthScore}%` }}
                ></div>
              </div>
              <div className="text-sm font-bold text-blue-500 mt-1">
                {strategy.keyMetrics.growthScore}/100
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2">Implementation</div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${100 - strategy.keyMetrics.complexityScore}%` }}
                ></div>
              </div>
              <div className="text-sm font-bold text-purple-500 mt-1">
                {100 - strategy.keyMetrics.complexityScore}/100
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Scenario Calculator Tab
const ScenarioCalculator: React.FC<any> = ({ inputs, setInputs, calculateProjections, formatCurrency, formatNumber }) => {
  const projections = calculateProjections();

  const handleInputChange = (key: keyof CalculatorInputs, value: number) => {
    setInputs({ ...inputs, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Calculator Inputs */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-500" />
          Scenario Inputs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InputSlider
            label="Monthly Signups"
            value={inputs.monthlySignups}
            onChange={(v) => handleInputChange('monthlySignups', v)}
            min={10}
            max={500}
            step={10}
            suffix=""
          />
          <InputSlider
            label="Conversion Rate"
            value={inputs.conversionRate}
            onChange={(v) => handleInputChange('conversionRate', v)}
            min={1}
            max={60}
            step={1}
            suffix="%"
          />
          <InputSlider
            label="Pro Plan Price"
            value={inputs.proPricing}
            onChange={(v) => handleInputChange('proPricing', v)}
            min={49}
            max={299}
            step={10}
            prefix="$"
          />
          <InputSlider
            label="Additional Seat Price"
            value={inputs.additionalSeatPrice}
            onChange={(v) => handleInputChange('additionalSeatPrice', v)}
            min={9}
            max={79}
            step={5}
            prefix="$"
          />
          <InputSlider
            label="Avg Seats Per Team"
            value={inputs.avgSeatsPerTeam}
            onChange={(v) => handleInputChange('avgSeatsPerTeam', v)}
            min={1}
            max={10}
            step={0.5}
            suffix=""
          />
          <InputSlider
            label="Monthly Churn Rate"
            value={inputs.churnRate}
            onChange={(v) => handleInputChange('churnRate', v)}
            min={1}
            max={20}
            step={1}
            suffix="%"
          />
          <InputSlider
            label="Cost Per Free User"
            value={inputs.costPerFreeUser}
            onChange={(v) => handleInputChange('costPerFreeUser', v)}
            min={0}
            max={10}
            step={0.5}
            prefix="$"
          />
          <InputSlider
            label="Cost Per Pro User"
            value={inputs.costPerProUser}
            onChange={(v) => handleInputChange('costPerProUser', v)}
            min={5}
            max={50}
            step={5}
            prefix="$"
          />
          <InputSlider
            label="Days to Convert"
            value={inputs.proConversionTime}
            onChange={(v) => handleInputChange('proConversionTime', v)}
            min={1}
            max={90}
            step={1}
            suffix=" days"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProjectionCard
          title="Month 3"
          projections={projections.month3}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
        />
        <ProjectionCard
          title="Month 12"
          projections={projections.month12}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
        />
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="font-semibold mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <MetricRow label="MRR (Month 12)" value={formatCurrency(projections.mrr12)} color="text-green-500" />
            <MetricRow label="ARR" value={formatCurrency(projections.arr12)} color="text-blue-500" />
            <MetricRow label="Customer LTV" value={formatCurrency(projections.ltv)} color="text-purple-500" />
            <MetricRow label="Payback Period" value={`${formatNumber(projections.paybackPeriod)} months`} color="text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Input Slider Component
const InputSlider: React.FC<any> = ({ label, value, onChange, min, max, step, prefix = '', suffix = '' }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <span className="text-sm font-bold text-white">{prefix}{value}{suffix}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
    />
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>{prefix}{min}{suffix}</span>
      <span>{prefix}{max}{suffix}</span>
    </div>
  </div>
);

// Projection Card Component
const ProjectionCard: React.FC<any> = ({ title, projections, formatCurrency, formatNumber }) => (
  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
    <h3 className="font-semibold mb-4">{title}</h3>
    <div className="space-y-4">
      <MetricRow label="Total Signups" value={formatNumber(projections.signups)} color="text-blue-500" />
      <MetricRow label="Pro Users" value={formatNumber(projections.proUsers)} color="text-purple-500" />
      <MetricRow label="Revenue" value={formatCurrency(projections.revenue)} color="text-green-500" />
      <MetricRow label="Costs" value={formatCurrency(projections.costs)} color="text-orange-500" />
      <MetricRow
        label="Profit"
        value={formatCurrency(projections.profit)}
        color={projections.profit > 0 ? 'text-green-500' : 'text-red-500'}
      />
    </div>
  </div>
);

// Metric Row Component
const MetricRow: React.FC<any> = ({ label, value, color }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-400">{label}</span>
    <span className={`text-sm font-bold ${color}`}>{value}</span>
  </div>
);

// Side by Side Comparison Tab
const SideBySideComparison: React.FC<any> = ({ strategies, formatCurrency, formatNumber }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-800">
          <th className="p-4 text-left border-b border-gray-700">Feature</th>
          {strategies.map((strategy: any) => (
            <th key={strategy.rank} className="p-4 text-center border-b border-gray-700">
              <div className="text-lg font-bold">{strategy.badge.split(' ')[0]}</div>
              <div className="text-sm">{strategy.name}</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-gray-800/50">
        <ComparisonRow label="12-Month Signups" values={strategies.map(s => formatNumber(s.projections.month12.signups))} />
        <ComparisonRow label="12-Month Pro Users" values={strategies.map(s => formatNumber(s.projections.month12.proUsers))} />
        <ComparisonRow label="Month 12 MRR" values={strategies.map(s => formatCurrency(s.projections.mrr12))} highlight />
        <ComparisonRow label="ARR" values={strategies.map(s => formatCurrency(s.projections.arr12))} highlight />
        <ComparisonRow label="Profitability Score" values={strategies.map(s => `${s.keyMetrics.profitabilityScore}/100`)} />
        <ComparisonRow label="Growth Score" values={strategies.map(s => `${s.keyMetrics.growthScore}/100`)} />
        <ComparisonRow label="Implementation" values={strategies.map(s => `${100 - s.keyMetrics.complexityScore}/100`)} />
      </tbody>
    </table>
  </div>
);

// Comparison Row Component
const ComparisonRow: React.FC<any> = ({ label, values, highlight = false }) => (
  <tr className="border-b border-gray-700">
    <td className="p-4 font-medium">{label}</td>
    {values.map((value: string, idx: number) => (
      <td key={idx} className={`p-4 text-center ${highlight ? 'font-bold text-green-500' : ''}`}>
        {value}
      </td>
    ))}
  </tr>
);

// Ask Astra Component
const AskAstraPricing: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ id: string; text: string; isUser: boolean }>>([
    {
      id: '1',
      text: "Hi! I'm here to help you think through pricing strategy. Ask me about:\n\n• Conversion rate projections\n• Trial vs freemium trade-offs\n• Pricing optimization\n• Feature limit recommendations\n• Revenue forecasts\n• Competitive analysis\n\nWhat would you like to explore?",
      isUser: false
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Should I use a paid trial or free trial?",
    "What conversion rate should I expect?",
    "How do I balance profitability and growth?",
    "What's the optimal trial length?",
    "Should I charge per seat or per team?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), text: input, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const response = {
        id: (Date.now() + 1).toString(),
        text: "Based on your strategic goal of profitability first, I recommend the 14-Day Paid Trial strategy. Here's why:\n\n• Highest conversion rate (40-50%)\n• Zero ongoing costs for non-payers\n• Fastest path to profitability (2-3 months)\n• Quality leads = lower churn\n\nWould you like me to explain the implementation details or compare it with other options?",
        isUser: false
      };
      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-2">Ask Astra About Pricing Strategy</h2>
        <p className="text-gray-400 text-sm">
          Get AI-powered recommendations and insights about your pricing model, conversion strategies, and revenue optimization.
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setInput(q)}
              className="px-3 py-2 bg-gray-900 hover:bg-gray-700 text-sm rounded-lg transition-colors border border-gray-700"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-4 ${
                msg.isUser
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'bg-gray-900 text-gray-200 border border-gray-700'
              }`}>
                <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-700 p-4 bg-gray-900">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about pricing strategy..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
