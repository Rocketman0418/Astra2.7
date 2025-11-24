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
