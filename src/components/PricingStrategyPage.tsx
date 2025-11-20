import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Users, Calculator, Zap, Crown, Target, AlertCircle, CheckCircle, MessageSquare, Mail, Bell, ArrowRight, Timer, Rocket, Gift } from 'lucide-react';

type StrategyType = 'trial' | 'freemium';

interface CalculatorInputs {
  strategyType: StrategyType;
  monthlySignups: number;
  conversionRate: number;
  proPricing: number;
  additionalSeatPrice: number;
  avgSeatsPerTeam: number;
  churnRate: number;
  costPerFreeUser: number;
  costPerProUser: number;
  trialLength: number;
}

export const PricingStrategyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recommended' | 'calculator' | 'comparison' | 'ask-astra'>('recommended');

  const [inputs, setInputs] = useState<CalculatorInputs>({
    strategyType: 'trial',
    monthlySignups: 100,
    conversionRate: 20,
    proPricing: 99,
    additionalSeatPrice: 29,
    avgSeatsPerTeam: 2.5,
    churnRate: 5,
    costPerFreeUser: 2,
    costPerProUser: 15,
    trialLength: 10
  });

  const calculateProjections = useMemo(() => {
    const signupsPerMonth = inputs.monthlySignups;
    const conversionRate = inputs.conversionRate / 100;
    const churnRate = inputs.churnRate / 100;
    const isTrial = inputs.strategyType === 'trial';

    // Month 1
    const month1 = {
      signups: signupsPerMonth,
      freeUsers: isTrial ? signupsPerMonth : signupsPerMonth,
      proUsers: 0,
      revenue: 0,
      costs: signupsPerMonth * inputs.costPerFreeUser,
      profit: -(signupsPerMonth * inputs.costPerFreeUser)
    };

    // Month 3
    const totalSignups3 = signupsPerMonth * 3;
    const conversions3 = totalSignups3 * conversionRate;
    const retainedPro3 = conversions3 * Math.pow(1 - churnRate, 3);
    const freeUsers3 = isTrial ? 0 : (totalSignups3 - conversions3);

    const revenue3 = retainedPro3 * inputs.proPricing +
                    (retainedPro3 * (inputs.avgSeatsPerTeam - 1) * inputs.additionalSeatPrice);
    const costs3 = (freeUsers3 * inputs.costPerFreeUser) + (retainedPro3 * inputs.costPerProUser);

    const month3 = {
      signups: totalSignups3,
      freeUsers: freeUsers3,
      proUsers: retainedPro3,
      revenue: revenue3,
      costs: costs3,
      profit: revenue3 - costs3
    };

    // Month 6
    const totalSignups6 = signupsPerMonth * 6;
    const conversions6 = totalSignups6 * conversionRate;
    const retainedPro6 = conversions6 * Math.pow(1 - churnRate, 6);
    const freeUsers6 = isTrial ? 0 : (totalSignups6 - conversions6);

    const revenue6 = retainedPro6 * inputs.proPricing +
                    (retainedPro6 * (inputs.avgSeatsPerTeam - 1) * inputs.additionalSeatPrice);
    const costs6 = (freeUsers6 * inputs.costPerFreeUser) + (retainedPro6 * inputs.costPerProUser);

    const month6 = {
      signups: totalSignups6,
      freeUsers: freeUsers6,
      proUsers: retainedPro6,
      revenue: revenue6,
      costs: costs6,
      profit: revenue6 - costs6
    };

    // Month 12
    const totalSignups12 = signupsPerMonth * 12;
    const conversions12 = totalSignups12 * conversionRate;
    const retainedPro12 = conversions12 * Math.pow(1 - churnRate, 12);
    const freeUsers12 = isTrial ? 0 : (totalSignups12 - conversions12);

    const revenue12 = retainedPro12 * inputs.proPricing +
                     (retainedPro12 * (inputs.avgSeatsPerTeam - 1) * inputs.additionalSeatPrice);
    const costs12 = (freeUsers12 * inputs.costPerFreeUser) + (retainedPro12 * inputs.costPerProUser);

    const month12 = {
      signups: totalSignups12,
      freeUsers: freeUsers12,
      proUsers: retainedPro12,
      revenue: revenue12,
      costs: costs12,
      profit: revenue12 - costs12
    };

    return {
      month1,
      month3,
      month6,
      month12,
      mrr12: revenue12,
      arr12: revenue12 * 12,
      ltv: (inputs.proPricing * 12) / churnRate,
      paybackPeriod: inputs.costPerFreeUser / (inputs.proPricing * conversionRate),
      profitableAtMonth: (() => {
        for (let m = 1; m <= 12; m++) {
          const totalSig = signupsPerMonth * m;
          const conv = totalSig * conversionRate;
          const retained = conv * Math.pow(1 - churnRate, m);
          const free = isTrial ? 0 : (totalSig - conv);
          const rev = retained * inputs.proPricing + (retained * (inputs.avgSeatsPerTeam - 1) * inputs.additionalSeatPrice);
          const cost = (free * inputs.costPerFreeUser) + (retained * inputs.costPerProUser);
          if (rev - cost > 0) return m;
        }
        return 13;
      })()
    };
  }, [inputs]);

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
                10-Day Trial vs Freemium Forever - Comprehensive Analysis
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500">Strategic Goal</div>
                <div className="text-sm font-semibold text-green-500">Fast Value + Conversion</div>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[
              { id: 'recommended', label: 'Strategy Overview', icon: Crown },
              { id: 'calculator', label: 'Live Calculator', icon: Calculator },
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
          <StrategyOverview formatCurrency={formatCurrency} formatNumber={formatNumber} />
        )}

        {activeTab === 'calculator' && (
          <LiveCalculator
            inputs={inputs}
            setInputs={setInputs}
            projections={calculateProjections}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}

        {activeTab === 'comparison' && (
          <ComprehensiveComparison formatCurrency={formatCurrency} formatNumber={formatNumber} />
        )}

        {activeTab === 'ask-astra' && (
          <AskAstraPricing />
        )}
      </div>
    </div>
  );
};

// Strategy Overview Tab
const StrategyOverview: React.FC<{
  formatCurrency: (n: number) => string;
  formatNumber: (n: number) => string;
}> = ({ formatCurrency, formatNumber }) => {
  return (
    <div className="space-y-8">
      {/* Key Requirements Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Key Requirements & Constraints</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
            <div>
              <div className="font-semibold">No Credit Card Required</div>
              <div className="text-sm text-gray-400">Lower signup friction, maximize account creation</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Timer className="w-5 h-5 text-blue-500 mt-1" />
            <div>
              <div className="font-semibold">10-Day Trial Period</div>
              <div className="text-sm text-gray-400">Focused timeframe to demonstrate value</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Rocket className="w-5 h-5 text-purple-500 mt-1" />
            <div>
              <div className="font-semibold">Accelerated Onboarding</div>
              <div className="text-sm text-gray-400">Guide users to value quickly with Astra</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-orange-500 mt-1" />
            <div>
              <div className="font-semibold">Active Engagement</div>
              <div className="text-sm text-gray-400">Email summaries and daily check-ins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trial Success Path */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Rocket className="w-6 h-6 text-green-500" />
          10-Day Trial: Path to Value
        </h2>
        <p className="text-gray-300 mb-6">
          Astra-guided journey to show transformative value within 10 days
        </p>

        <div className="space-y-4">
          {[
            {
              day: 'Days 1-2',
              title: 'Document Sync Setup',
              description: 'Astra guides through Gmail & Google Drive connection. First sync shows instant value with organized data.',
              actions: ['Connect Gmail', 'Connect Google Drive', 'Select key folders', 'First data sync completes']
            },
            {
              day: 'Days 3-4',
              title: '2 Powerful Starting Prompts',
              description: 'Astra suggests personalized prompts based on synced data that deliver immediate insights.',
              actions: ['Prompt 1: "Summarize my top priorities from last week\'s emails"', 'Prompt 2: "What are the key action items from my recent meetings?"', 'Experience AI-powered synthesis', 'See value of connected data']
            },
            {
              day: 'Days 5-7',
              title: 'First Transformative Report',
              description: 'Generate a comprehensive report that showcases the power of automated intelligence.',
              actions: ['Astra recommends report type', 'Generate weekly summary report', 'Save & schedule for future', 'Experience time savings']
            },
            {
              day: 'Days 8-10',
              title: 'Engagement & Decision',
              description: 'Reinforce value with daily engagement and clear upgrade path.',
              actions: ['Daily email summaries', 'Check-ins with 3 Questions for Astra', 'In-app reminders of value delivered', 'Seamless upgrade flow']
            }
          ].map((phase, idx) => (
            <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                    {phase.day}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{phase.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{phase.description}</p>
                  <div className="space-y-1">
                    {phase.actions.map((action, aidx) => (
                      <div key={aidx} className="flex items-center gap-2 text-sm text-gray-300">
                        <ArrowRight className="w-3 h-3 text-green-500" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Strategies */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-500" />
          Continuous Engagement Strategies
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 rounded-lg p-4">
            <Mail className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-semibold mb-2">Report Summaries via Email</h3>
            <p className="text-sm text-gray-400 mb-3">
              Send daily/weekly report highlights with deep-link back to app for full access
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Morning delivery (7-8am)</div>
              <div>• Key insights preview</div>
              <div>• One-click to view in app</div>
              <div>• Builds habit loop</div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <MessageSquare className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="font-semibold mb-2">Daily "3 Questions for Astra"</h3>
            <p className="text-sm text-gray-400 mb-3">
              Personalized questions based on user's data that will revolutionize their work today
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Context-aware prompts</div>
              <div>• Easy one-click to ask</div>
              <div>• Showcases AI power</div>
              <div>• Drives daily usage</div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <TrendingUp className="w-8 h-8 text-orange-500 mb-3" />
            <h3 className="font-semibold mb-2">Daily Summary Digest</h3>
            <p className="text-sm text-gray-400 mb-3">
              Comprehensive roundup of activity, insights, and value delivered
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Stats on queries answered</div>
              <div>• Time saved calculation</div>
              <div>• New insights discovered</div>
              <div>• Usage streak tracking</div>
            </div>
          </div>
        </div>
      </div>

      {/* Freemium Limitations */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Gift className="w-6 h-6 text-cyan-500" />
          Post-Trial: Limited Free Account Option
        </h2>

        <p className="text-gray-300 mb-6">
          If user doesn't convert after 10-day trial, they can keep a limited free account:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 text-green-500">Free Tier Features</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>5 AI questions per week</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>1 scheduled report (weekly only)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>50 documents synced</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>View-only access to 1 template agent</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Basic visualizations (no saving)</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-purple-500">Pro Upgrade Benefits</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-500 mt-0.5" />
                <span>Unlimited AI questions</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-500 mt-0.5" />
                <span>Unlimited scheduled reports (any frequency)</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-500 mt-0.5" />
                <span>500 documents synced</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-500 mt-0.5" />
                <span>Build & run 5 custom agents</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-500 mt-0.5" />
                <span>Save & share visualizations</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-purple-500 mt-0.5" />
                <span>Team collaboration (3 seats included)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>Strategy:</strong> Free tier provides enough value to stay engaged, but clear limitations create natural upgrade triggers when users hit limits doing real work.
          </p>
        </div>
      </div>
    </div>
  );
};

// Live Calculator Tab
const LiveCalculator: React.FC<any> = ({ inputs, setInputs, projections, formatCurrency, formatNumber }) => {
  const handleInputChange = (key: keyof CalculatorInputs, value: number | string) => {
    setInputs({ ...inputs, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Strategy Toggle */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Select Strategy Type</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleInputChange('strategyType', 'trial')}
            className={`p-4 rounded-lg border-2 transition-all ${
              inputs.strategyType === 'trial'
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <div className="text-lg font-bold mb-1">10-Day Free Trial</div>
            <div className="text-sm text-gray-400">Then upgrade or limited free account</div>
          </button>
          <button
            onClick={() => handleInputChange('strategyType', 'freemium')}
            className={`p-4 rounded-lg border-2 transition-all ${
              inputs.strategyType === 'freemium'
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <div className="text-lg font-bold mb-1">Freemium Forever</div>
            <div className="text-sm text-gray-400">Limited free tier always available</div>
          </button>
        </div>
      </div>

      {/* Calculator Inputs */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-500" />
          Adjust Variables
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InputSlider
            label="Monthly Signups"
            value={inputs.monthlySignups}
            onChange={(v) => handleInputChange('monthlySignups', v)}
            min={10}
            max={500}
            step={10}
          />
          <InputSlider
            label="Conversion Rate"
            value={inputs.conversionRate}
            onChange={(v) => handleInputChange('conversionRate', v)}
            min={5}
            max={50}
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
            label="Seat Price"
            value={inputs.additionalSeatPrice}
            onChange={(v) => handleInputChange('additionalSeatPrice', v)}
            min={9}
            max={79}
            step={5}
            prefix="$"
          />
          <InputSlider
            label="Avg Seats/Team"
            value={inputs.avgSeatsPerTeam}
            onChange={(v) => handleInputChange('avgSeatsPerTeam', v)}
            min={1}
            max={10}
            step={0.5}
          />
          <InputSlider
            label="Monthly Churn"
            value={inputs.churnRate}
            onChange={(v) => handleInputChange('churnRate', v)}
            min={1}
            max={20}
            step={1}
            suffix="%"
          />
          <InputSlider
            label="Cost/Free User"
            value={inputs.costPerFreeUser}
            onChange={(v) => handleInputChange('costPerFreeUser', v)}
            min={0}
            max={10}
            step={0.5}
            prefix="$"
          />
          <InputSlider
            label="Cost/Pro User"
            value={inputs.costPerProUser}
            onChange={(v) => handleInputChange('costPerProUser', v)}
            min={5}
            max={50}
            step={5}
            prefix="$"
          />
          {inputs.strategyType === 'trial' && (
            <InputSlider
              label="Trial Length"
              value={inputs.trialLength}
              onChange={(v) => handleInputChange('trialLength', v)}
              min={7}
              max={30}
              step={1}
              suffix=" days"
            />
          )}
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Time to Profitable"
          value={`Month ${projections.profitableAtMonth}`}
          color="text-green-500"
          icon={TrendingUp}
        />
        <MetricCard
          label="Year 1 ARR"
          value={formatCurrency(projections.arr12)}
          color="text-blue-500"
          icon={DollarSign}
        />
        <MetricCard
          label="Customer LTV"
          value={formatCurrency(projections.ltv)}
          color="text-purple-500"
          icon={Users}
        />
        <MetricCard
          label="Payback Period"
          value={`${formatNumber(projections.paybackPeriod)} mo`}
          color="text-yellow-500"
          icon={Timer}
        />
      </div>

      {/* Timeline Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <ProjectionCard
          title="Month 1"
          projections={projections.month1}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
        />
        <ProjectionCard
          title="Month 3"
          projections={projections.month3}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
        />
        <ProjectionCard
          title="Month 6"
          projections={projections.month6}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
        />
        <ProjectionCard
          title="Month 12"
          projections={projections.month12}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
        />
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
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
    />
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>{prefix}{min}{suffix}</span>
      <span>{prefix}{max}{suffix}</span>
    </div>
  </div>
);

// Metric Card Component
const MetricCard: React.FC<any> = ({ label, value, color, icon: Icon }) => (
  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
    <div className="flex items-start justify-between mb-2">
      <div className="text-xs text-gray-400">{label}</div>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
  </div>
);

// Projection Card Component
const ProjectionCard: React.FC<any> = ({ title, projections, formatCurrency, formatNumber }) => (
  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
    <h3 className="font-semibold mb-4 text-center">{title}</h3>
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-400">Signups</span>
        <span className="font-semibold text-blue-500">{formatNumber(projections.signups)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Pro Users</span>
        <span className="font-semibold text-purple-500">{formatNumber(projections.proUsers)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Free Users</span>
        <span className="font-semibold text-gray-500">{formatNumber(projections.freeUsers)}</span>
      </div>
      <div className="border-t border-gray-700 pt-2"></div>
      <div className="flex justify-between">
        <span className="text-gray-400">Revenue</span>
        <span className="font-semibold text-green-500">{formatCurrency(projections.revenue)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Costs</span>
        <span className="font-semibold text-orange-500">{formatCurrency(projections.costs)}</span>
      </div>
      <div className="flex justify-between font-bold">
        <span className="text-gray-300">Profit</span>
        <span className={projections.profit > 0 ? 'text-green-500' : 'text-red-500'}>
          {formatCurrency(projections.profit)}
        </span>
      </div>
    </div>
  </div>
);

// Comprehensive Comparison Tab
const ComprehensiveComparison: React.FC<any> = ({ formatCurrency, formatNumber }) => {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-2">Strategy Comparison: 10-Day Trial vs Freemium Forever</h2>
        <p className="text-gray-400">
          Comprehensive side-by-side analysis of both pricing strategies with realistic projections
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="p-4 text-left font-semibold border-b border-gray-700">Metric</th>
                <th className="p-4 text-center font-semibold border-b border-gray-700 bg-green-500/10">
                  <div className="text-lg">10-Day Free Trial</div>
                  <div className="text-xs text-gray-400 font-normal">No CC → Upgrade or Limited Free</div>
                </th>
                <th className="p-4 text-center font-semibold border-b border-gray-700 bg-blue-500/10">
                  <div className="text-lg">Freemium Forever</div>
                  <div className="text-xs text-gray-400 font-normal">Free tier always available</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow
                category="User Acquisition"
                metric="Monthly Signups"
                trial="100-150"
                freemium="150-200"
                winner="freemium"
              />
              <ComparisonRow
                category="User Acquisition"
                metric="Signup Friction"
                trial="Low (no CC required)"
                freemium="Very Low (free forever)"
                winner="freemium"
              />
              <ComparisonRow
                category="Conversion"
                metric="Trial→Pro Rate"
                trial="20-25%"
                freemium="10-15%"
                winner="trial"
              />
              <ComparisonRow
                category="Conversion"
                metric="Time to Convert"
                trial="10 days (forced decision)"
                freemium="45-90 days (gradual)"
                winner="trial"
              />
              <ComparisonRow
                category="Revenue (Year 1)"
                metric="Month 6 MRR"
                trial="$2,500"
                freemium="$1,800"
                winner="trial"
              />
              <ComparisonRow
                category="Revenue (Year 1)"
                metric="Month 12 ARR"
                trial="$48,000"
                freemium="$36,000"
                winner="trial"
              />
              <ComparisonRow
                category="Costs"
                metric="Free User Costs"
                trial="$200/mo (trial only)"
                freemium="$2,000/mo (ongoing)"
                winner="trial"
              />
              <ComparisonRow
                category="Costs"
                metric="Time to Profitable"
                trial="Month 3-4"
                freemium="Month 6-8"
                winner="trial"
              />
              <ComparisonRow
                category="Product Complexity"
                metric="Limit Management"
                trial="Simple (trial vs pro)"
                freemium="Complex (track limits)"
                winner="trial"
              />
              <ComparisonRow
                category="Product Complexity"
                metric="User Experience"
                trial="Clear deadline = urgency"
                freemium="No pressure = exploration"
                winner="tie"
              />
              <ComparisonRow
                category="Long-term Growth"
                metric="Viral Coefficient"
                trial="0.3-0.5 (moderate)"
                freemium="0.6-0.8 (high)"
                winner="freemium"
              />
              <ComparisonRow
                category="Long-term Growth"
                metric="Market Reach"
                trial="Qualified users only"
                freemium="Maximum exposure"
                winner="freemium"
              />
              <ComparisonRow
                category="Customer Quality"
                metric="User Intent"
                trial="High (trying for purpose)"
                freemium="Mixed (casual browsers)"
                winner="trial"
              />
              <ComparisonRow
                category="Customer Quality"
                metric="Churn Rate"
                trial="5-8% (committed users)"
                freemium="8-12% (less committed)"
                winner="trial"
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-6 border-2 border-green-500/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Recommended: 10-Day Trial</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Best for your goals: faster profitability, higher quality users, clearer conversion path
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-green-500 mt-0.5" />
              <span>2x better conversion rate (20-25% vs 10-15%)</span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-green-500 mt-0.5" />
              <span>10x lower ongoing free user costs</span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Profitable 3-4 months sooner</span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Simpler product with less complexity</span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Users kept engaged with limited free option</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-6 border-2 border-blue-500/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Alternative: Freemium</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Consider if you prioritize maximum user base growth and viral expansion
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5" />
              <span>50% more signups (200 vs 130/month)</span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5" />
              <span>Higher viral coefficient (more sharing)</span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5" />
              <span>Users evaluate thoroughly before paying</span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5" />
              <span>Larger addressable market</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
              <span className="text-orange-300">Trade-off: Higher costs, slower profitability</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Comparison Row Component
const ComparisonRow: React.FC<any> = ({ category, metric, trial, freemium, winner }) => (
  <tr className="border-b border-gray-700 hover:bg-gray-900/50">
    <td className="p-4">
      <div className="text-xs text-gray-500">{category}</div>
      <div className="font-medium">{metric}</div>
    </td>
    <td className={`p-4 text-center ${winner === 'trial' ? 'bg-green-500/10 font-semibold' : ''}`}>
      {trial}
      {winner === 'trial' && <div className="text-xs text-green-500 mt-1">✓ Better</div>}
    </td>
    <td className={`p-4 text-center ${winner === 'freemium' ? 'bg-blue-500/10 font-semibold' : ''}`}>
      {freemium}
      {winner === 'freemium' && <div className="text-xs text-blue-500 mt-1">✓ Better</div>}
    </td>
  </tr>
);

// Ask Astra Component (Simplified)
const AskAstraPricing: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ id: string; text: string; isUser: boolean }>>([
    {
      id: '1',
      text: "Hi! I can help you think through your pricing strategy decisions. Based on your requirements:\n\n• No credit card at signup\n• 10-day trial period\n• Focus on fast value demonstration\n• Need for user engagement strategies\n\nWhat questions do you have?",
      isUser: false
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Why 10 days instead of 14 for the trial?",
    "How do I maximize conversion in 10 days?",
    "What limits should the free tier have?",
    "Should I send daily emails or weekly?",
    "How aggressive should upgrade prompts be?"
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

    setTimeout(() => {
      let responseText = "Based on your goals and the data, here's my recommendation...";

      if (input.toLowerCase().includes('10 days')) {
        responseText = "10 days creates healthy urgency without overwhelming users. It's enough time to:\n\n• Complete document sync (2 days)\n• Experience 2 powerful prompts (2 days)\n• Generate first meaningful report (3 days)\n• See value of automation (3 days)\n\nShorter than 14 days keeps momentum and decision fatigue low. You want users to decide while the value is fresh.";
      } else if (input.toLowerCase().includes('conversion')) {
        responseText = "To maximize 10-day conversion:\n\n1. Astra-guided onboarding (remove friction)\n2. Suggested prompts based on user data\n3. Daily email engagement with value highlights\n4. In-app progress tracker showing journey\n5. Day 7-9: Gentle reminders of value delivered\n6. Day 10: Simple, clear upgrade path\n\nThe key is showing transformative value, not just features.";
      } else if (input.toLowerCase().includes('limits') || input.toLowerCase().includes('free tier')) {
        responseText = "Free tier limits should:\n\n✓ Allow enough use to stay engaged (5 questions/week)\n✓ One report to maintain habit loop\n✓ Limited data (50 docs) creates upgrade pressure\n✓ View-only agent access = taste of power\n\nThe goal: Users hit limits during real work, when motivation to upgrade is highest.";
      }

      const response = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false
      };
      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-2">Ask Astra About Your Strategy</h2>
        <p className="text-gray-400 text-sm">
          Get insights on pricing decisions, conversion optimization, and user engagement tactics.
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-wrap gap-2">
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
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
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
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
              placeholder="Ask about your pricing strategy..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-700 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
