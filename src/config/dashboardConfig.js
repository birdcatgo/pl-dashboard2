import { Brain, DollarSign, BarChart2, Target, TrendingUp, ChartBar, Calendar, Users, Receipt } from 'lucide-react';

export const mainTabs = [
  { id: 'ai-insights', label: 'AI Insights', icon: Brain },
  { id: 'media-buyer-pl', label: 'Media Buyer P&L', icon: DollarSign },
  { id: 'eod-report', label: 'EOD Report', icon: BarChart2 },
  { id: 'highlights', label: 'Highlights', icon: Target },
  { id: 'net-profit', label: 'Net Profit', icon: TrendingUp },
  { id: 'cash-credit', label: 'Credit Line', icon: DollarSign },
  { id: 'network-caps', label: 'Network Caps', icon: ChartBar },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'thirty-day-challenge', label: '30 Day Challenge', icon: Calendar },
  { id: 'pl', label: 'Profit & Loss', icon: BarChart2 },
  { id: 'network', label: 'Offer Performance', icon: Target },
  { id: 'media-buyers', label: 'Media Buyers', icon: Users }
];

export const moreTabs = {
  'overview-v2': { enabled: true },
  'financial-overview': { enabled: true },
  'cash-position': { enabled: true },
  'upcoming-expenses': { enabled: true },
  'monthly-expenses': { enabled: true },
  'revenue-flow': { enabled: true },
  'cash-flow': { enabled: true },
  'daily-spend': { enabled: true },
  'bank-goals': { enabled: true },
  'tradeshift': { enabled: true },
  'breakevenCalculator': { enabled: true }
};

export const getVisibleTabs = (tabs, configSection) => {
  return tabs.filter(tab => configSection[tab.id]?.enabled !== false);
}; 