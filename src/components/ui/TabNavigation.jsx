import React from 'react';
import { Brain, Calculator, FileText, LineChart, UserCheck, Wrench, MessageCircle } from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const mainTabs = [
    { id: 'dashboard-index', label: 'Dashboard Index', icon: Brain },
    { id: 'daily-update', label: 'Daily Updates', icon: MessageCircle },
    { id: 'accounting', label: 'Profit Metrics', icon: Calculator },
    { id: 'accounts', label: 'Accounts Receivable & Payable', icon: FileText },
    { id: 'reporting', label: 'Reporting', icon: LineChart },
    { id: 'contractor-info', label: 'Contractor Information', icon: UserCheck },
    { id: 'tools', label: 'Tools', icon: Wrench }
  ];

  return (
    <div className="border-t border-gray-700/50">
      <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm flex items-center transition-all duration-200
                ${
                  activeTab === tab.id
                    ? 'border-[#4A90E2] text-[#4A90E2]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }
              `}
            >
              {Icon && <Icon className="w-4 h-4 mr-2" />}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation; 