import React, { useState } from 'react';
import AIInsightsPage from './AIInsightsPage';
import PerformancePage from './PerformancePage';
import DailyUpdate from './DailyUpdate';
import TimezoneConverter from './TimezoneConverter';
import AdAccounts from './AdAccounts';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('ai-insights');
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === 'ai-insights' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('ai-insights')}
        >
          AI Insights
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === 'performance' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === 'tools' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('tools')}
        >
          Tools
        </button>
      </div>
      
      {activeTab === 'ai-insights' && <AIInsightsPage performanceData={performanceData} invoiceData={invoiceData} />}
      {activeTab === 'performance' && <PerformancePage performanceData={performanceData} />}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TimezoneConverter />
          <AdAccounts />
          <DailyUpdate />
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 