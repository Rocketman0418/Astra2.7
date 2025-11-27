/**
 * Marketing Context for Email Generation
 * This file provides feature descriptions and benefits for AI-generated marketing emails
 */

export const PRODUCT_FEATURES = {
  core: {
    title: "Astra Intelligence - AI Connected to ALL Your Data",
    tagline: "AI that Works for Work",
    description: "The central AI platform for the RocketHub ecosystem, designed to synthesize data and provide intelligent insights for entrepreneurs.",
  },

  keyFeatures: [
    {
      name: "Private AI Conversations",
      description: "Have secure, private conversations with Astra AI to get personalized insights from your business data",
      icon: "🤖",
      benefits: [
        "Ask questions about your business data in natural language",
        "Get AI-powered insights and analysis instantly",
        "Keep your conversations completely private and secure"
      ]
    },
    {
      name: "Team Collaboration",
      description: "Collaborate with your team using AI assistance with real-time synchronization",
      icon: "👥",
      benefits: [
        "@mention team members and AI to bring them into conversations",
        "Real-time message synchronization across all devices",
        "Share insights and visualizations with your team instantly"
      ]
    },
    {
      name: "AI-Powered Visualizations",
      description: "Transform your data into beautiful, interactive visual dashboards with AI",
      icon: "📊",
      benefits: [
        "Generate charts and dashboards from conversational requests",
        "Interactive HTML visualizations you can explore",
        "Save and share your favorite visualizations"
      ]
    },
    {
      name: "Google Drive Integration",
      description: "Connect your Google Drive to give Astra access to all your business documents",
      icon: "📁",
      benefits: [
        "Automatically sync and index your documents",
        "Ask questions about any file in your Drive",
        "Multi-folder support for organized data access"
      ]
    },
    {
      name: "Gmail Integration",
      description: "Give Astra access to your emails for comprehensive business insights",
      icon: "📧",
      benefits: [
        "Search and analyze your email conversations",
        "Get summaries of important email threads",
        "Find information buried in old emails instantly"
      ]
    },
    {
      name: "Scheduled Reports",
      description: "Set up automated reports that arrive in your inbox on your schedule",
      icon: "📅",
      benefits: [
        "Daily, weekly, or monthly automated insights",
        "Customizable report templates for different data sources",
        "Beautiful visualizations included automatically"
      ]
    },
    {
      name: "Meeting Intelligence",
      description: "Search and analyze your meeting notes and transcripts with AI",
      icon: "💼",
      benefits: [
        "Find decisions and action items from past meetings",
        "Search across all your meeting history",
        "Get summaries of meeting topics and outcomes"
      ]
    },
    {
      name: "Template Library (Powered by n8n)",
      description: "Browse and deploy pre-built automation workflows for common business tasks",
      icon: "🔧",
      benefits: [
        "100+ ready-to-use automation templates",
        "One-click deployment to your workspace",
        "Customize templates for your specific needs"
      ]
    },
    {
      name: "Mobile-First PWA",
      description: "Access Astra from any device with our Progressive Web App",
      icon: "📱",
      benefits: [
        "Works seamlessly on mobile, tablet, and desktop",
        "Install as an app on any device",
        "Optimized for touch and mobile interactions"
      ]
    },
    {
      name: "Multi-Team Support",
      description: "Manage multiple teams with separate data and permissions",
      icon: "🏢",
      benefits: [
        "Isolated data for each team",
        "Role-based access control",
        "Easy team member management and invitations"
      ]
    }
  ],

  benefits: {
    productivity: [
      "Get answers in seconds instead of hours of searching",
      "Automate routine reporting and analysis tasks",
      "Spend less time in meetings reviewing data"
    ],
    insights: [
      "Discover patterns and trends you might have missed",
      "Get AI-powered recommendations based on your data",
      "Make data-driven decisions with confidence"
    ],
    collaboration: [
      "Keep your entire team aligned with shared insights",
      "Reduce information silos across departments",
      "Enable faster decision-making with real-time data access"
    ],
    security: [
      "Enterprise-grade security for your sensitive data",
      "Row-level security ensures proper data access",
      "Your data never leaves your controlled environment"
    ]
  },

  useCases: [
    {
      title: "Business Analytics",
      description: "Ask Astra about sales trends, customer metrics, and business performance"
    },
    {
      title: "Document Research",
      description: "Find information across all your Google Drive documents instantly"
    },
    {
      title: "Email Intelligence",
      description: "Search your email history and get summaries of important conversations"
    },
    {
      title: "Meeting Follow-up",
      description: "Track action items and decisions from your meeting notes"
    },
    {
      title: "Automated Reporting",
      description: "Get regular insights delivered to your inbox automatically"
    },
    {
      title: "Team Communication",
      description: "Collaborate with AI assistance in team conversations"
    }
  ],

  advancedUseCases: [
    {
      title: "Automated Competitive Intelligence",
      subtitle: "Weekly market insights delivered while you sleep",
      description: "Connect your Google Drive folder containing competitor research, industry reports, and market analysis. Set up a weekly scheduled report that asks: \"Analyze all new competitor activity, pricing changes, and market trends from this week. Compare against our positioning and identify 3 immediate opportunities.\" Every Monday at 8 AM, Astra delivers a comprehensive competitive brief synthesizing everything that matters - without you lifting a finger. Traditional AI tools require you to manually upload files and ask the same questions repeatedly. Astra does this autonomously while you sleep."
    },
    {
      title: "Cross-Document Pattern Recognition",
      subtitle: "Find insights hidden across hundreds of files",
      description: "Connect your Google Drive folders containing customer feedback, meeting notes, support tickets, and sales calls. Ask Astra: \"Search all documents from Q4 and identify recurring pain points, feature requests, and complaints. Group by severity and frequency.\" Astra analyzes hundreds of documents simultaneously, finding patterns across 6 months of conversations that would take weeks to review manually. Traditional AI can only analyze what you paste into a single chat - Astra connects the dots across your entire document library."
    },
    {
      title: "Board-Ready Financial Narratives",
      subtitle: "Transform raw numbers into executive insights",
      description: "Upload your financial statements, P&L reports, and cash flow projections to your connected Google Drive financial folder. Schedule a monthly report asking: \"Create an executive summary of our financial performance this month. Highlight: revenue trends vs forecast, top 3 expense categories that increased, cash runway projection, and 2 strategic recommendations based on the data.\" Astra generates a narrative analysis with visualizations, ready to present to your board. Traditional AI requires you to manually format data, explain context, and can't maintain month-over-month comparison context."
    },
    {
      title: "Proactive Team Health Monitoring",
      subtitle: "Spot burnout and project risks before they explode",
      description: "Connect team meeting notes, project documentation, and status updates in Google Drive. Ask Astra weekly: \"Analyze all team communications and meeting notes. Identify team members showing signs of overwork, projects experiencing scope creep, and areas where deadlines are at risk. Rank by urgency.\" Astra reads between the lines across dozens of documents, spotting patterns like increasing meeting frequency, timeline slippage mentions, or stressed language that indicate problems before they explode. Traditional AI can't maintain team context or analyze sentiment across multiple document types."
    },
    {
      title: "Meeting Intelligence & Accountability",
      subtitle: "Never lose a decision or commitment again",
      description: "Connect your Google Meet transcripts and ask Astra weekly: \"Review all meetings from this week. Extract every commitment made, decision reached, and action item assigned. Create an accountability tracker showing: who committed to what, by when, and current status based on follow-up mentions in later meetings.\" Schedule this as an automated Friday report that holds the entire team accountable without you manually taking notes in every meeting. Traditional AI can't track commitments across multiple meetings or identify when promises aren't being kept."
    },
    {
      title: "Strategic Plan Synthesis",
      subtitle: "Transform scattered ideas into coherent strategy",
      description: "Throughout the quarter, you save random notes, meeting discussions, and brainstorming documents to a \"Strategy Ideas\" folder in Google Drive. At quarter-end, ask Astra: \"Review all documents in my Strategy folder. Synthesize into a coherent Q2 strategic plan with: top 3 priorities, success metrics, resource requirements, and timeline. Identify conflicting ideas and propose resolutions.\" Astra reads 50+ documents, identifies themes, resolves contradictions, and creates a structured plan. Traditional AI would require you to manually consolidate everything first."
    },
    {
      title: "Data-Driven Pricing Strategy",
      subtitle: "Multi-source pricing intelligence in one analysis",
      description: "Connect folders containing: competitor pricing research, customer feedback about pricing, your internal cost data, and sales win/loss analysis. Ask Astra: \"Analyze our current pricing against competitor positioning, customer price sensitivity from feedback, and our cost structure. Recommend a pricing strategy for our Q2 launch with 3 tier options, including expected conversion impacts and revenue projections.\" Astra synthesizes market data, customer psychology, and financial realities into actionable pricing recommendations. Traditional AI can't cross-reference multiple data sources to build comprehensive pricing intelligence."
    },
    {
      title: "Custom Research Methodology",
      subtitle: "Teach Astra your framework once, use it forever",
      description: "Connect Google Drive folders with your research sources (industry reports, academic papers, case studies). First, have a conversation with Astra explaining your research framework: \"When I ask for market research, always include: TAM/SAM/SOM analysis, key player positioning, regulatory considerations, and technology trends. Use data from the 'Market Research' folder.\" Then schedule monthly: \"Generate a market analysis report for our expansion into healthcare.\" Astra follows your custom methodology consistently. Traditional AI has no memory of your preferences and requires re-explaining frameworks every time."
    },
    {
      title: "Self-Updating Knowledge Base",
      subtitle: "Living documentation that stays current automatically",
      description: "Connect all your Google Drive folders - sales playbooks, product documentation, HR policies, and process guides. Ask Astra: \"Create a comprehensive knowledge base answer for: 'How do we handle enterprise contract negotiations?' Pull from sales playbooks, legal templates, past deal notes, and pricing guidelines. Update this answer monthly as new documents are added.\" Set this as a scheduled report for your top 20 most-asked questions. Astra maintains living documentation that stays current. Traditional AI requires manual updates and can't automatically incorporate new information as your organization evolves."
    },
    {
      title: "Multi-Quarter Trend Analysis",
      subtitle: "See patterns that only emerge over time",
      description: "Connect folders containing quarterly reports, monthly metrics, and performance data going back 2+ years. Ask Astra: \"Analyze our business performance over the past 8 quarters. Identify: seasonal patterns, growth trajectory changes, which initiatives delivered ROI vs failed, and predictive indicators for our next quarter's success. Create a trend visualization showing the story of our growth.\" Astra maintains historical context that lets you see macro patterns impossible to spot in point-in-time analysis. Traditional AI has no memory beyond a single conversation and can't compare data across time periods without you manually providing everything."
    }
  ],

  techStack: {
    ai: "Powered by Google Gemini Flash for fast, accurate responses",
    backend: "Built on Supabase for real-time collaboration and security",
    automation: "Integrated with n8n for powerful workflow automation",
    integration: "Connects with Google Drive, Gmail, and more"
  }
};

export function getFeatureContext(contextType: 'full' | 'core' | 'benefits' | 'useCases' = 'full'): string {
  if (contextType === 'core') {
    return `
PRODUCT: ${PRODUCT_FEATURES.core.title}
TAGLINE: ${PRODUCT_FEATURES.core.tagline}
DESCRIPTION: ${PRODUCT_FEATURES.core.description}

KEY FEATURES:
${PRODUCT_FEATURES.keyFeatures.map(f => `- ${f.name}: ${f.description}`).join('\n')}
    `.trim();
  }

  if (contextType === 'benefits') {
    return `
PRODUCTIVITY BENEFITS:
${PRODUCT_FEATURES.benefits.productivity.map(b => `- ${b}`).join('\n')}

INSIGHTS BENEFITS:
${PRODUCT_FEATURES.benefits.insights.map(b => `- ${b}`).join('\n')}

COLLABORATION BENEFITS:
${PRODUCT_FEATURES.benefits.collaboration.map(b => `- ${b}`).join('\n')}

SECURITY BENEFITS:
${PRODUCT_FEATURES.benefits.security.map(b => `- ${b}`).join('\n')}
    `.trim();
  }

  if (contextType === 'useCases') {
    return `
COMMON USE CASES:
${PRODUCT_FEATURES.useCases.map(uc => `- ${uc.title}: ${uc.description}`).join('\n')}

ADVANCED USE CASES (High ROI Scenarios):
${PRODUCT_FEATURES.advancedUseCases.map(auc => `
${auc.title} - ${auc.subtitle}
${auc.description}
`).join('\n')}
    `.trim();
  }

  // Full context
  return `
${getFeatureContext('core')}

${getFeatureContext('benefits')}

${getFeatureContext('useCases')}

TECHNOLOGY:
- AI: ${PRODUCT_FEATURES.techStack.ai}
- Backend: ${PRODUCT_FEATURES.techStack.backend}
- Automation: ${PRODUCT_FEATURES.techStack.automation}
- Integrations: ${PRODUCT_FEATURES.techStack.integration}
  `.trim();
}
