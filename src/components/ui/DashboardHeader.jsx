import React from 'react';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import TabNavigation from './TabNavigation';

const DashboardHeader = ({ 
  isRefreshing, 
  lastUpdated, 
  onRefresh,
  activeTab,
  onTabChange
}) => {
  const handleRefresh = () => { 
    if (!isRefreshing) {
      onRefresh();
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 bg-[#1C1F2B] shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Content */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="bg-white/10 p-2 rounded-lg shadow-md">
              <img 
                src="/convert2freedom_logo.png" 
                alt="Convert2Freedom Logo" 
                className="h-8 w-auto"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Business Intelligence Dashboard</h1>
              <p className="text-xs text-gray-400">Convert2Freedom Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className={`inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                isRefreshing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            {lastUpdated && (
              <div className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-md">
                Last Updated: {format(lastUpdated, 'MMM d, yyyy h:mm a')}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>
    </header>
  );
};

export default DashboardHeader; 