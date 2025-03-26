import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Search, Brain, TrendingUp, FileText, DollarSign } from 'lucide-react';
import AIInsightsPage from './AIInsightsPage';
import OfferPerformance from './OfferPerformance';

const DashboardLayout = ({ performanceData, invoiceData, expenseData }) => {
  const [activeTab, setActiveTab] = useState('ai-insights');

  const tabs = [
    {
      id: 'ai-insights',
      name: 'AI Insights',
      icon: Brain,
      component: AIInsightsPage
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: TrendingUp,
      component: OfferPerformance
    },
    // Add other tabs as needed (Invoices, Expenses, etc.)
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Main Header */}
      <header className="bg-black shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <img 
              src="/c2f-logo.png" 
              alt="Convert 2 Freedom" 
              className="h-10"
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${activeTab === tab.id
                      ? 'bg-[#FF0000] text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-[#FF0000]'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={activeTab === tab.id ? 'block' : 'hidden'}
            >
              <tab.component
                performanceData={performanceData}
                invoiceData={invoiceData}
                expenseData={expenseData}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout; 