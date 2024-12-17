import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { debounce } from 'lodash';
import { processPerformanceData } from '../lib/pl-data-processor';
import EnhancedDateSelector from '../components/dashboard/EnhancedDateSelector';
import CashSituation from '../components/dashboard/CashSituation';
import OverviewMetrics from '../components/dashboard/OverviewMetrics';
import NetworkPerformance from '../components/dashboard/NetworkPerformance';
import MediaBuyerPerformance from '../components/dashboard/MediaBuyerPerformance';
import MonthlyProfitOverview from '../components/dashboard/MonthlyProfitOverview';
import NetworkPayments from '../components/dashboard/NetworkPayments';
import ImprovedCashFlow from '../components/dashboard/ImprovedCashFlow';
import CashFlowDashboard from '../components/dashboard/CashFlowDashboard';
import MediaBuyerSpend from '../components/dashboard/MediaBuyerSpend';
import FinancialResources from '../components/dashboard/FinancialResources';
import PLDashboardComponent from '../components/dashboard/PLDashboard';
import EnhancedOverviewV2 from '../components/dashboard/EnhancedOverviewV2';


export default function DashboardPage() {
  const [plData, setPlData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('pl');
  const [dateRange, setDateRange] = useState({ startDate: new Date(), endDate: new Date() });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    overallMetrics: {},
    networkPerformance: [],
    mediaBuyerPerformance: [],
    offerPerformance: [],
    filteredData: [],
    comparisonData: null,
  });
  const [performanceData, setPerformanceData] = useState([]);
  const [cashManagementData, setCashManagementData] = useState(null);
  const [networkPaymentsData, setNetworkPaymentsData] = useState([]);

  const tabs = [
    { id: 'overview-v2', label: 'Overview' },
    { id: 'cash-flow', label: 'Cash Flow' }, 
    { id: 'pl', label: 'Profit & Loss' },
    { id: 'network', label: 'Network Performance' },
    { id: 'media-buyers', label: 'Media Buyers' },
  ];


  const processSheetData = (data) => {

    try {
      if (data.performanceData) {
        setPerformanceData(data.performanceData);
        const processed = processPerformanceData(data.performanceData, dateRange);
        setDashboardData(processed);
      }
  
      if (data.plData) {
        setPlData(data.plData);
      }
  
      // Validate and ensure cashFlowData.financialResources is an array
      const validatedData = {
        ...data.cashFlowData,
        financialResources: Array.isArray(data.cashFlowData?.financialResources)
          ? data.cashFlowData.financialResources.filter(
              resource => resource && typeof resource.account === 'string'
            )
          : [],
      };
  
      console.log('Validated cash flow data:', validatedData);
  
      setCashManagementData(validatedData);
  
      if (data.networkPaymentsData) {
        setNetworkPaymentsData(data.networkPaymentsData);
      }
    } catch (error) {
      console.error('Error processing sheet data:', error);
      setError('Failed to process updated data');
    }
  };
  

   const loadDashboardData = async () => {
    try {
      if (isRefreshing) return;
      setIsRefreshing(true);
      setError(null);
  
      const response = await fetch('/api/sheets', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'  
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data); 
      processSheetData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDateChange = (newDateRange) => {
    setDateRange(newDateRange);
    if (performanceData.length > 0) {
      const processed = processPerformanceData(performanceData, newDateRange);
      setDashboardData(processed);
    }
  };

  const handleRefresh = () => { 
    if (!isRefreshing) {
      loadDashboardData();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview-v2':
        return (
          <EnhancedOverviewV2
            performanceData={performanceData}
            cashFlowData={cashManagementData}  
            plData={plData}
          />  
        );
      case 'pl': 
        return <PLDashboardComponent plData={plData} />;
      case 'network':
        return (
            <NetworkPerformance
              data={dashboardData.networkPerformance}
              rawData={dashboardData.filteredData}
              offerPerformance={dashboardData.offerPerformance}
              dateRange={dateRange}
            />
          );
        case 'media-buyers':  
          return (
            <MediaBuyerPerformance 
              data={dashboardData.mediaBuyerPerformance}
              rawData={dashboardData.filteredData}
              dateRange={dateRange}  
            />
          );
        case 'cash-flow':
        const financialResources = cashManagementData?.financialResources || [];

        const totalCash = financialResources
          .filter((resource) => {
            if (!resource || typeof resource.account !== 'string') {
              console.warn('Invalid financial resource:', resource);
              return false;
            }
            return resource.account.toLowerCase().includes('bank') || 
                   resource.account.toLowerCase().includes('cash');
          })
          .reduce((sum, resource) => sum + (parseFloat(resource.available) || 0), 0);

        const totalCredit = financialResources
          .filter((resource) => {
            if (!resource || typeof resource.account !== 'string') {
              console.warn('Invalid financial resource:', resource);
              return false;
            }
            return resource.account.toLowerCase().includes('credit') || resource.limit;
          })
          .reduce((sum, resource) => sum + (parseFloat(resource.available) || 0), 0);

        if (financialResources.length === 0) {
          return <p className="text-gray-600">No financial data available.</p>;
        }

        return (
          <div className="space-y-6">
            <div className="w-full">
              <MediaBuyerSpend
                cashManagementData={{
                  currentBalance: totalCash,
                  creditAvailable: totalCredit,
                }}
              />
            </div>
            <FinancialResources financialResources={financialResources} />
            <ImprovedCashFlow startingBalance={totalCash} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <div className="flex items-center gap-4">
     
            <button
              onClick={handleRefresh}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isRefreshing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            {lastUpdated && (
              <div className="text-sm text-gray-500">
                Last Updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {typeof error === 'string' ? error : 'An error occurred while loading data.'}
                </p>
              </div>
            </div>
          </div>
        )}

{isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-6"> 
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)} 
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                      ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {['network', 'media-buyers'].includes(activeTab) && (
              <EnhancedDateSelector onDateChange={handleDateChange} />
            )}
            
            <div className="mt-6">{renderTabContent()}</div>
          </div>
        )}
      </div>
    </main>
  );
}
