import { Brain, DollarSign, BarChart2, Target, TrendingUp, ChartBar, Calendar, Users } from 'lucide-react';

// Tab definitions
export const mainTabs = [
  { id: 'ai-insights', label: 'AI Insights', icon: Brain },
  { id: 'media-buyer-pl', label: 'Media Buyer P&L', icon: DollarSign },
  { id: 'eod-report', label: 'EOD Report', icon: BarChart2 },
  { id: 'highlights', label: 'Highlights', icon: Target },
  { id: 'net-profit', label: 'Net Profit', icon: TrendingUp },
  { id: 'cash-credit', label: 'Credit Line', icon: DollarSign },
  { id: 'network-caps', label: 'Network Caps', icon: ChartBar },
  { id: 'thirty-day-challenge', label: '30 Day Challenge', icon: Calendar },
  { id: 'pl', label: 'Profit & Loss', icon: BarChart2 },
  { id: 'network', label: 'Offer Performance', icon: Target },
  { id: 'media-buyers', label: 'Media Buyers', icon: Users }
];

export const moreTabs = [
  { id: 'overview-v2', label: 'Overview' },
  { id: 'financial-overview', label: 'Financial Overview' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'cash-position', label: 'Cash Position' },
  { id: 'upcoming-expenses', label: 'Expenses' },
  { id: 'monthly-expenses', label: 'Monthly Expenses' },
  { id: 'revenue-flow', label: 'Revenue Flow' },
  { id: 'cash-flow', label: 'Cash Flow' },
  { id: 'daily-spend', label: 'Daily Spend' },
  { id: 'bank-goals', label: 'Profit Distribution' },
  { id: 'tradeshift', label: 'Tradeshift Cards' },
  { id: 'breakevenCalculator', label: 'Breakeven Calculator' }
];

// Visibility configuration
export const dashboardConfig = {
  // Main tabs configuration
  mainTabs: {
    'ai-insights': { enabled: true },
    'media-buyer-pl': { enabled: true },
    'eod-report': { enabled: true },
    'highlights': { enabled: true },
    'net-profit': { enabled: true },
    'cash-credit': { enabled: true },
    'network-caps': { enabled: true },
    'thirty-day-challenge': { enabled: true },
    'pl': { enabled: true },
    'network': { enabled: true },
    'media-buyers': { enabled: true }
  },
  
  // More tabs configuration - all disabled
  moreTabs: {
    'overview-v2': { enabled: false },
    'financial-overview': { enabled: false },
    'invoices': { enabled: false },
    'cash-position': { enabled: false },
    'upcoming-expenses': { enabled: false },
    'monthly-expenses': { enabled: false },
    'revenue-flow': { enabled: false },
    'cash-flow': { enabled: false },
    'daily-spend': { enabled: false },
    'bank-goals': { enabled: false },
    'tradeshift': { enabled: false },
    'breakevenCalculator': { enabled: false }
  }
};

// Helper function to get visible tabs
export const getVisibleTabs = (tabs, configSection) => {
  return tabs.filter(tab => dashboardConfig[configSection][tab.id]?.enabled);
}; 