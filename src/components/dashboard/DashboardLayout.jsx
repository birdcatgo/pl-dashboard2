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
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import ChartContainer from '@/components/ui/ChartContainer';
import PageHeader from '@/components/ui/PageHeader';
import { dashboardConfig, getVisibleTabs, mainTabs, moreTabs } from '@/config/dashboardConfig';

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

  // Filter visible tabs using the configuration
  const visibleMainTabs = useMemo(() => getVisibleTabs(mainTabs, 'mainTabs'), []);
  const visibleMoreTabs = useMemo(() => getVisibleTabs(moreTabs, 'moreTabs'), []);

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai-insights':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="AI Insights" 
              subtitle="Intelligent analysis of your business performance"
              icon={Brain}
            />
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
          <div className="space-y-8">
            <PageHeader 
              title="Media Buyer P&L" 
              subtitle="Performance and profitability analysis"
              icon={DollarSign}
            />
            <MediaBuyerPL performanceData={performanceData} />
          </div>
        );
      case 'eod-report':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="EOD Report" 
              subtitle="End of day performance summary"
              icon={BarChart2}
            />
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
          <div className="space-8">
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
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
      {/* Fixed Header */}
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
                  Last Updated: {lastUpdated.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-700/50">
            <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
              {visibleMainTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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
              
              {/* More dropdown */}
              {visibleMoreTabs.length > 0 && (
                <div className="relative flex items-center">
                  <button
                    ref={moreButtonRef}
                    onClick={handleMoreClick}
                    className="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 flex items-center gap-1 transition-all duration-200"
                  >
                    More
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {showMoreMenu && (
                    <div 
                      className="fixed mt-2 w-56 rounded-lg shadow-lg bg-[#1C1F2B] ring-1 ring-black ring-opacity-5 z-50 border border-gray-700/50"
                      style={{
                        top: 'var(--menu-top, 64px)',
                        left: 'var(--menu-left, auto)',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="py-1">
                        {visibleMoreTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id);
                              setShowMoreMenu(false);
                            }}
                            className={`
                              block w-full text-left px-4 py-2 text-sm transition-all duration-200
                              ${
                                activeTab === tab.id
                                  ? 'bg-white/10 text-[#4A90E2]'
                                  : 'text-gray-300 hover:bg-white/5'
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
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-[#E74C3C] p-4 mb-6 rounded-md shadow-sm">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-[#C0392B]">
                    {typeof error === 'string' ? error : 'An error occurred while loading data.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area with Light Background */}
          <div className="space-y-8">
            {['media-buyers', 'network'].includes(activeTab) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <EnhancedDateSelector 
                  onDateChange={handleDateChange}
                  selectedPeriod={dateRange.period}
                  defaultRange="last7"
                  latestDate={getLatestDataDate(performanceData)}
                />
              </div>
            )}

            {/* Content Sections with Improved Spacing */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              {/* Main Content */}
              <div className="mt-6">{renderTabContent()}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};