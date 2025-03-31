import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, ChevronDown, Brain, TrendingUp, DollarSign, Target, Calendar, ChartBar, BarChart2, Users } from 'lucide-react';
import { debounce } from 'lodash';
import EnhancedDateSelector from './EnhancedDateSelector';
import CashSituation from './CashSituation';
import OverviewMetrics from './OverviewMetrics';
import OfferPerformance from './OfferPerformance';
import MediaBuyerPerformance from './MediaBuyerPerformance';
import MonthlyProfitOverview from './MonthlyProfitOverview';
import NetworkPayments from './NetworkPayments';
import ImprovedCashFlow from './ImprovedCashFlow';
import CashFlowDashboard from './CashFlowDashboard';
import MediaBuyerSpend from './MediaBuyerSpend';
import FinancialResources from './FinancialResources';
import EnhancedOverviewV2 from './EnhancedOverviewV2';
import InvoicesTable from './InvoicesTable';
import UpcomingExpensesTable from './UpcomingExpensesTable';
import EnhancedCashFlowProjection from './EnhancedCashFlowProjection';
import NetworkCapsTab from './NetworkCapsTab';
import CashCreditBalancesTab from './CashCreditBalancesTab';
import DailySpendCalculatorTab from './DailySpendCalculatorTab';
import NetProfit from './NetProfit';
import ProfitDistribution from './ProfitDistribution';
import CreditLine from './CreditLine';
import CashPosition from './CashPosition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PLDashboard from '@/components/dashboard/PLDashboard';
import CashFlowProjection from './CashFlowProjection';
import ImprovedPLDashboard from './ImprovedPLDashboard';
import Highlights from './Highlights';
import FinancialOverview from './FinancialOverview';
import RevenueFlowAnalysis from './RevenueFlowAnalysis';
import TradeshiftOverview from './TradeshiftOverview';
import CreditCardLimits from './CreditCardLimits';
import ThirtyDayChallenge from './ThirtyDayChallenge';
import MediaBuyerProgress from './MediaBuyerProgress';
import CreditLineManager from './CreditLineManager';
import FinancialOverviewBox from './FinancialOverviewBox';
import AIInsightsPage from './AIInsightsPage';
import MediaBuyerPL from './MediaBuyerPL';
import MonthlyExpenses from './MonthlyExpenses';
import BreakevenCalculator from '@/components/dashboard/BreakevenCalculator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EODReport from './EODReport';

export default function DashboardLayout({ 
  performanceData, 
  invoiceData, 
  expenseData, 
  cashFlowData,
  networkTermsData,
  tradeshiftData: initialTradeshiftData,
  plData: initialPlData 
}) {
  const [activeTab, setActiveTab] = useState('ai-insights');
  const [dateRange, setDateRange] = useState({
    startDate: new Date('2025-03-23'),
    endDate: new Date('2025-03-29'),
    period: 'last7'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);
  const [tradeshiftData, setTradeshiftData] = useState(initialTradeshiftData || []);
  const [plData, setPlData] = useState(initialPlData || null);
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreButtonRef = useRef(null);
  const [selectedView, setSelectedView] = useState('overview');

  // Update state when props change
  useEffect(() => {
    setTradeshiftData(initialTradeshiftData || []);
  }, [initialTradeshiftData]);

  useEffect(() => {
    setPlData(initialPlData || null);
  }, [initialPlData]);

  // Set up initial data
  useEffect(() => {
    if (performanceData && invoiceData && expenseData && cashFlowData) {
      console.log('Setting up dashboard with data:', {
        hasPerformanceData: !!performanceData,
        performanceDataLength: performanceData?.length,
        hasCashFlowData: !!cashFlowData,
        hasInvoiceData: !!invoiceData,
        hasExpenseData: !!expenseData,
        hasTradeshiftData: !!tradeshiftData,
        hasPlData: !!plData
      });
      setLastUpdated(new Date());
      setError(null); // Clear any previous errors
    } else {
      setError('Missing required data. Please refresh the page.');
    }
  }, [performanceData, invoiceData, expenseData, cashFlowData, tradeshiftData, plData]);

  // Monitor Tradeshift data changes
  useEffect(() => {
    console.log('Tradeshift data state updated:', tradeshiftData);
  }, [tradeshiftData]);

  const handleDateChange = (newDateRange) => {
    console.log('Date range changed:', newDateRange);
    
    // Ensure we have both start and end dates
    if (!newDateRange.startDate || !newDateRange.endDate) {
      console.warn('Invalid date range received:', newDateRange);
      return;
    }

    // Update the date range state
    setDateRange(newDateRange);
  };

  const handleRefresh = () => { 
    if (!isRefreshing) {
      setIsRefreshing(true);
      setError(null); // Clear any previous errors
      window.location.reload();
      setLastUpdated(new Date());
    }
  };

  const handleMoreClick = () => {
    if (moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      document.documentElement.style.setProperty('--menu-top', `${rect.bottom}px`);
      document.documentElement.style.setProperty('--menu-left', `${rect.left + (rect.width / 2)}px`);
    }
    setShowMoreMenu(!showMoreMenu);
  };

  const mainTabs = [
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

  const moreTabs = [
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai-insights':
        return (
          <div className="space-y-6">
            <AIInsightsPage
              performanceData={performanceData}
              invoicesData={invoiceData}
              expenseData={expenseData}
              cashFlowData={cashFlowData}
            />
          </div>
        );
      case 'media-buyer-pl':
        return (
          <div className="space-y-6">
            <MediaBuyerPL performanceData={performanceData} />
          </div>
        );
      case 'eod-report':
        return (
          <div className="space-y-6">
            <EODReport performanceData={performanceData} />
          </div>
        );
      case 'net-profit':
        console.log('Net Profit tab data:', {
          performanceData: performanceData?.length,
          dateRange,
          cashFlowData,
          networkTerms: networkTermsData,
        });
        return (
          <div className="space-y-6">
            <NetProfit
              performanceData={performanceData}
              dateRange={dateRange}
              cashFlowData={{
                ...cashFlowData,
                networkTerms: networkTermsData
              }}
            />
          </div>
        );
      case 'overview-v2':
        return (
          <div className="space-y-6">
            <EnhancedOverviewV2 
              performanceData={performanceData || []}
              cashFlowData={cashFlowData}
              plData={plData}
              networkTermsData={networkTermsData}
            />
          </div>
        );
  
      case 'bank-goals':
        return (
          <div className="space-y-6">
            <ProfitDistribution
              cashFlowData={cashFlowData}
              networkTermsData={networkTermsData}
              netProfit={plData?.summary?.[plData.summary.length - 1]?.NetProfit || 0}
            />
          </div>
        );
  
      case 'cash-credit':
        return (
          <CreditLine 
            data={{
              performanceData,
              invoicesData: invoiceData,
              cashFlowData,
              payrollData: expenseData
            }}
            loading={isRefreshing}
            error={error}
          />
        );
  
        case 'network-caps':
          return (
            <NetworkCapsTab 
              networkTerms={networkTermsData || []}
            />
          );
  
      case 'daily-spend':
        return (
          <DailySpendCalculatorTab 
            cashManagementData={cashFlowData}
            performanceData={performanceData}
            offerCaps={networkTermsData || []}
          />
        );
        
      case 'cash-flow':
        return (
          <CashFlowProjection 
            projectionData={{
              currentBalance: cashFlowData?.availableCash || 0,
              creditAvailable: cashFlowData?.creditAvailable || 0,
              startingBalance: cashFlowData?.currentBalance || 0,
              invoices: invoiceData || [],
              payrollData: expenseData || [],
              creditCards: cashFlowData?.financialResources?.filter(r => r.owing > 0) || [],
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
        console.log('Invoices Data being passed:', invoiceData);
        return (
          <div className="space-y-6">
            <InvoicesTable data={invoiceData || []} />
          </div>
        );
        
      case 'upcoming-expenses':
        console.log('Expenses Data:', expenseData);
        return (
          <div className="space-y-6">
            <UpcomingExpensesTable data={expenseData || []} />
          </div>
        );
  
      case 'cash-position':
        return (
          <CashPosition 
            cashFlowData={cashFlowData}
            networkPaymentsData={networkPaymentsData}
            invoicesData={invoiceData}
          />
        );
  
      case 'financial-overview':
        return (
          <div className="space-y-6">
            <FinancialOverview 
              plData={plData}
              cashFlowData={cashFlowData}
              invoicesData={invoiceData}
              networkTerms={networkTermsData || []}
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
            networkTerms={networkTermsData}
            invoicesData={invoiceData}
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
              financialResources={cashFlowData?.financialResources || []}
            />
          </div>
        );
  
      case 'thirty-day-challenge':
        return (
          <div className="space-y-8">
            <ThirtyDayChallenge performanceData={performanceData} />
            <MediaBuyerProgress performanceData={performanceData} />
          </div>
        );
  
      case 'monthly-expenses':
        return (
          <div className="space-y-6">
            <MonthlyExpenses expensesData={expenseData || []} />
        </div>
        );
  
      case 'breakevenCalculator':
        return <BreakevenCalculator data={performanceData} />;
  
      default:
        return null;
    }
  };

  // Add this function to get the latest date from performance data
  const getLatestDataDate = (data) => {
    if (!data?.length) return new Date('2025-03-29'); // Return the latest known date in the dataset
    
    const dates = data
      .map(entry => {
        if (!entry.Date) return null;
        const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day);
      })
      .filter(Boolean);
    
    return dates.length ? new Date(Math.max(...dates)) : new Date('2025-03-29');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              {mainTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                      whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm flex items-center
                      ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {Icon && <Icon className="w-4 h-4 mr-2" />}
                    {tab.label}
                </button>
              );
            })}
              
              {/* More dropdown */}
              <div className="relative flex items-center">
                <button
                  ref={moreButtonRef}
                  onClick={handleMoreClick}
                  className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center gap-1"
                >
                  More
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showMoreMenu && (
                  <div 
                    className="fixed mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                    style={{
                      top: 'var(--menu-top, 64px)',
                      left: 'var(--menu-left, auto)',
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="py-1">
                      {moreTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setShowMoreMenu(false);
                          }}
                          className={`
                            block w-full text-left px-4 py-2 text-sm
                            ${
                              activeTab === tab.id
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
          </nav>
        </div>

          {['media-buyers', 'network'].includes(activeTab) && (
            <EnhancedDateSelector 
              onDateChange={handleDateChange}
              selectedPeriod={dateRange.period}
              defaultRange="last7"
              latestDate={getLatestDataDate(performanceData)}
            />
          )}

          <div className="mt-6">{renderTabContent()}</div>
        </div>
      </div>
    </main>
  );
};