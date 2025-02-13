import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { debounce } from 'lodash';
import { processPerformanceData } from '../lib/pl-data-processor';
import EnhancedDateSelector from '../components/dashboard/EnhancedDateSelector';
import CashSituation from '../components/dashboard/CashSituation';
import OverviewMetrics from '../components/dashboard/OverviewMetrics';
import OfferPerformance from '../components/dashboard/OfferPerformance';
import MediaBuyerPerformance from '../components/dashboard/MediaBuyerPerformance';
import MonthlyProfitOverview from '../components/dashboard/MonthlyProfitOverview';
import NetworkPayments from '../components/dashboard/NetworkPayments';
import ImprovedCashFlow from '../components/dashboard/ImprovedCashFlow';
import CashFlowDashboard from '../components/dashboard/CashFlowDashboard';
import MediaBuyerSpend from '../components/dashboard/MediaBuyerSpend';
import FinancialResources from '../components/dashboard/FinancialResources';
import EnhancedOverviewV2 from '../components/dashboard/EnhancedOverviewV2';
import InvoicesTable from '../components/dashboard/InvoicesTable';
import UpcomingExpensesTable from '../components/dashboard/UpcomingExpensesTable';
import EnhancedCashFlowProjection from '../components/dashboard/EnhancedCashFlowProjection';
import NetworkCapsTab from '../components/dashboard/NetworkCapsTab';
import CashCreditBalancesTab from '../components/dashboard/CashCreditBalancesTab';
import DailySpendCalculatorTab from '../components/dashboard/DailySpendCalculatorTab';
import NetProfit from '../components/dashboard/NetProfit';
import ProfitDistribution from '../components/dashboard/ProfitDistribution';
import CreditLine from '../components/dashboard/CreditLine';
import CashPosition from '../components/dashboard/CashPosition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PLDashboard from '@/components/dashboard/PLDashboard';
import CashFlowProjection from '../components/dashboard/CashFlowProjection';
import ImprovedPLDashboard from '../components/dashboard/ImprovedPLDashboard';
import Highlights from '../components/dashboard/Highlights';
import FinancialOverview from '../components/dashboard/FinancialOverview';
import RevenueFlowAnalysis from '../components/dashboard/RevenueFlowAnalysis';
import TradeshiftOverview from '../components/dashboard/TradeshiftOverview';
import CreditCardLimits from '../components/dashboard/CreditCardLimits';

export default function DashboardPage() {
  const [plData, setPlData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('overview-v2');
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
    financialGoals: {
      operatingCash: 500000,
      savings: 500000,
      creditLine: 3000000
    }
  });
  const [performanceData, setPerformanceData] = useState(null);
  const [cashManagementData, setCashManagementData] = useState(null);
  const [networkPaymentsData, setNetworkPaymentsData] = useState([]);
  const [invoicesData, setInvoicesData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [mediaBuyerData, setMediaBuyerData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [summaryData, setSummaryData] = useState([]);
  const [tradeshiftData, setTradeshiftData] = useState([]);

  const tabs = [
    { id: 'overview-v2', label: 'Overview' },
    { id: 'financial-overview', label: 'Financial Overview' },
    { id: 'tradeshift', label: 'Tradeshift Cards', icon: '💳' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'cash-position', label: 'Cash Position' },
    { id: 'net-profit', label: 'Net Profit' },
    { id: 'bank-goals', label: 'Profit Distribution' },
    { id: 'cash-credit', label: 'Credit Line' },
    { id: 'network-caps', label: 'Network Caps' },
    { id: 'daily-spend', label: 'Daily Spend' },
    { id: 'cash-flow', label: 'Cash Flow' }, 
    { id: 'pl', label: 'Profit & Loss' },
    { id: 'network', label: 'Offer Performance' },
    { id: 'media-buyers', label: 'Media Buyers' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'upcoming-expenses', label: 'Expenses' },
    { id: 'revenue-flow', label: 'Revenue Flow' }
  ];

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sheets');
      const data = await response.json();
      
      console.log('Dashboard received data:', {
        hasNetworkTerms: !!data.networkTerms,
        networkTermsCount: data.networkTerms?.length,
        sampleTerm: data.networkTerms?.[0]
      });

      // Update all state variables
      setRawData({
        ...data.rawData,
        networkTerms: data.networkTerms
      });
      setPlData(data.plData);
      setPerformanceData(data.performanceData);
      setCashManagementData(data.cashFlowData);
      setInvoicesData(data.rawData?.invoices || []);
      setPayrollData(data.rawData?.payroll || []);
      setTradeshiftData(data.tradeshiftData);
      setNetworkPaymentsData(data.networkPaymentsData);
      setSummaryData(data.summaryData);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Only fetch on mount
  useEffect(() => {
    fetchDashboardData();
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
      fetchDashboardData();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'net-profit':
        console.log('Net Profit tab data:', {
          performanceData: performanceData?.length,
          dateRange,
          samplePerformanceData: performanceData?.[0]
        });
        return (
          <div className="space-y-6">
            <NetProfit 
              performanceData={performanceData}
              dateRange={dateRange}
            />
          </div>
        );
      case 'overview-v2':
        return (
          <div className="space-y-6">
            <EnhancedOverviewV2 
              performanceData={performanceData || []}
              cashFlowData={cashManagementData}
              plData={plData}
              data={rawData}
            />
          </div>
        );
  
      case 'bank-goals':
        return (
          <div className="space-y-6">
            <ProfitDistribution
              cashFlowData={cashManagementData}
              bankStructure={rawData?.bankStructure}
              netProfit={plData?.summary?.[plData.summary.length - 1]?.NetProfit || 0}
              creditLimits={rawData?.creditLimits}
              otherCards={rawData?.otherCards}
            />
          </div>
        );
  
      case 'cash-credit':
        return (
          <CreditLine 
            cashFlowData={{
              financialResources: cashManagementData?.financialResources || [],
              availableCash: cashManagementData?.availableCash || 0,
              creditAvailable: cashManagementData?.creditAvailable || 0
            }} 
          />
        );
  
        case 'network-caps':
          return (
            <NetworkCapsTab 
              networkTerms={rawData?.networkTerms || []}
            />
          );
  
      case 'daily-spend':
        return (
          <DailySpendCalculatorTab 
            cashManagementData={cashManagementData}
            performanceData={performanceData}
            offerCaps={rawData?.networkTerms || []}
          />
        );
        
      case 'cash-flow':
        return (
          <CashFlowProjection 
            projectionData={{
              currentBalance: cashManagementData?.availableCash || 0,
              creditAvailable: cashManagementData?.creditAvailable || 0,
              startingBalance: cashManagementData?.currentBalance || 0,
              invoices: rawData?.invoices || [],
              payrollData: payrollData || [],
              creditCards: rawData?.financialResources?.filter(r => r.owing > 0) || [],
              mediaBuyerData: performanceData
            }}
          />
        );
  
      case 'pl':
        return (
          <ImprovedPLDashboard 
            plData={plData}
            summaryData={plData?.summary || []}
          />
        );
  
      case 'network':
        return (
          <div className="space-y-6">
            <OfferPerformance 
              performanceData={performanceData}
              dateRange={dateRange}
            />
          </div>
        );
  
      case 'media-buyers':
        return (
          <div className="space-y-6">
            <MediaBuyerPerformance 
              performanceData={performanceData}
              dateRange={dateRange}
            />
          </div>
        );
  
      case 'invoices':
        console.log('Invoices Data being passed:', invoicesData);
        return (
          <div className="space-y-6">
            <InvoicesTable data={invoicesData || []} />
          </div>
        );
       
    case 'upcoming-expenses':
      console.log('Expenses Data:', payrollData);
      return (
        <div className="space-y-6">
          <UpcomingExpensesTable data={payrollData || []} />
        </div>
      );
  
      case 'cash-position':
        return (
          <CashPosition 
            cashFlowData={cashManagementData}
            networkPaymentsData={networkPaymentsData}
            invoicesData={invoicesData}
          />
        );
  
      case 'financial-overview':
        return (
          <div className="space-y-6">
            <FinancialOverview 
              plData={plData}
              cashFlowData={cashManagementData}
              invoicesData={invoicesData}
              networkTerms={rawData?.networkTerms || []}
            />
          </div>
        );
  
      case 'highlights':
        return (
          <div className="space-y-6">
            <Highlights performanceData={performanceData} />
          </div>
        );
  
      case 'revenue-flow':
        return (
          <RevenueFlowAnalysis 
            performanceData={performanceData}
            networkTerms={rawData?.networkTerms}
            invoicesData={invoicesData}
            plData={plData}
          />
        );
  
      case 'tradeshift':
        console.log('Rendering tradeshift tab with data:', tradeshiftData);
        return (
          <div className="space-y-6">
            <TradeshiftOverview 
              tradeshiftData={tradeshiftData} 
            />
            <CreditCardLimits 
              financialResources={rawData?.financialResources || []}
            />
          </div>
        );
  
      default:
        return null;
    }
  };

  // Add useEffect to log state changes
  useEffect(() => {
    console.log('Tradeshift data state updated:', tradeshiftData);
  }, [tradeshiftData]);

  if (isLoading) {
    return (
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={fetchDashboardData}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 rounded-lg border shadow-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </main>
    );
  }

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

        <div className="space-y-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
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
      </div>
    </main>
  );
}