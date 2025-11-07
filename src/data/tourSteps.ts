import { TourStep } from '../components/InteractiveTour';

export const memberTourSteps: TourStep[] = [
  {
    id: 'welcome-chat',
    title: 'Meet Astra, Your AI Assistant',
    description: 'Type any question here and I\'ll help you find answers from your team\'s data. Try asking me to create visualizations or search through your documents!',
    targetSelector: '[data-tour="chat-input"]',
    position: 'top'
  },
  {
    id: 'chat-modes',
    title: 'Private or Team Chat',
    description: 'Use Private mode for personal questions that only you can see. Switch to Team mode when you want everyone to collaborate on insights together.',
    targetSelector: '[data-tour="mode-toggle"]',
    position: 'bottom'
  },
  {
    id: 'reports-view',
    title: 'Manage & View Reports',
    description: 'Access the Reports page to view scheduled reports and create your own custom reports. You can manage, edit, and delete any reports you\'ve created.',
    targetSelector: '[data-tour="reports-button"]',
    position: 'right'
  },
  {
    id: 'visualizations',
    title: 'Data Visualizations',
    description: 'Click "Create Visualizations" button in any conversation to generate charts from your data. Your visualizations are private to you. Use "Retry" to generate different versions, or save your favorites!',
    targetSelector: '[data-tour="chat-input"]',
    position: 'top'
  },
  {
    id: 'user-settings',
    title: 'Your Profile & Settings',
    description: 'Click here to manage your profile, adjust notification preferences, and access team settings. You can also restart this tour anytime from here!',
    targetSelector: '[data-tour="user-menu"]',
    position: 'bottom'
  }
];

export const adminTourSteps: TourStep[] = [
  {
    id: 'welcome-chat',
    title: 'Meet Astra, Your AI Assistant',
    description: 'Type any question here and I\'ll help you find answers from your team\'s data. Try asking me to create visualizations or search through your documents!',
    targetSelector: '[data-tour="chat-input"]',
    position: 'top'
  },
  {
    id: 'chat-modes',
    title: 'Private or Team Chat',
    description: 'Use Private mode for personal questions that only you can see. Switch to Team mode when you want everyone to collaborate on insights together.',
    targetSelector: '[data-tour="mode-toggle"]',
    position: 'bottom'
  },
  {
    id: 'reports-view',
    title: 'Manage & View Reports',
    description: 'Access the Reports page to view, create, and manage reports. As an admin, you can also set up automated scheduled reports that run daily, weekly, or monthly from Team Settings.',
    targetSelector: '[data-tour="reports-button"]',
    position: 'right'
  },
  {
    id: 'team-members',
    title: 'Manage Your Team',
    description: 'View all team members here. As an admin, you can invite new members, manage roles, and remove users from your team.',
    targetSelector: '[data-tour="team-panel"]',
    position: 'left'
  },
  {
    id: 'user-settings',
    title: 'Team Settings & Profile',
    description: 'Access team settings to connect Google Drive, configure scheduled reports, and manage team-wide preferences. You can also update your personal profile here.',
    targetSelector: '[data-tour="user-menu"]',
    position: 'bottom'
  },
  {
    id: 'visualizations',
    title: 'Data Visualizations',
    description: 'Click "Create Visualizations" button in any conversation to generate charts from your data. Your visualizations are private to you. Use "Retry" to generate different versions, or save your favorites!',
    targetSelector: '[data-tour="chat-input"]',
    position: 'top'
  }
];

export function getTourStepsForRole(isAdmin: boolean): TourStep[] {
  return isAdmin ? adminTourSteps : memberTourSteps;
}
