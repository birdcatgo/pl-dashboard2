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

export default function DashboardLayout({ performanceData, invoiceData, expenseData }) {
  const [plData, setPlData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('overview-v2');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    period: 'last7'
  });
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
  const [cashManagementData, setCashManagementData] = useState(null);
  const [networkPaymentsData, setNetworkPaymentsData] = useState([]);
  const [mediaBuyerData, setMediaBuyerData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [summaryData, setSummaryData] = useState([]);
  const [tradeshiftData, setTradeshiftData] = useState([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreButtonRef = useRef(null);
  const [selectedView, setSelectedView] = useState('overview');

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

  // Only fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/sheets');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setRawData(data);
      setPlData(data.plData);
      setCashManagementData(data.cashManagementData);
      setNetworkPaymentsData(data.networkPayments || []);
      setTradeshiftData(data.tradeshiftData || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

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
      fetchDashboardData();
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
          <div className="space-y-6">
            <AIInsightsPage
              performanceData={performanceData}
              invoicesData={invoiceData}
              expenseData={expenseData}
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
          samplePerformanceData: performanceData?.[0]
        });

        // Debug logging for financial metrics
        console.log('Raw financial data:', {
          invoiceData,
          rawData: {
            networkTerms: rawData?.networkTerms,
            financialResources: rawData?.financialResources
          },
          cashManagementData
        });

        // Calculate financial metrics
        const cashInBank = cashManagementData?.availableCash || 0;
        const creditCardDebt = (rawData?.financialResources || [])
          .filter(resource => resource.owing > 0)
          .reduce((sum, card) => sum + (parseFloat(card.owing) || 0), 0);
        const outstandingInvoices = (invoiceData || [])
          .filter(invoice => !invoice.paid && invoice.Amount > 0)
          .reduce((sum, invoice) => sum + (parseFloat(invoice.Amount) || 0), 0);
        const networkExposure = (rawData?.networkTerms || [])
          .reduce((sum, term) => sum + (parseFloat(term.runningTotal) || 0), 0);

        console.log('Calculated financial metrics:', {
          cashInBank,
          creditCardDebt,
          outstandingInvoices,
          networkExposure,
          invoiceCount: invoiceData?.length,
          networkTermsCount: rawData?.networkTerms?.length
        });

        return (
          <div className="space-y-6">
            <FinancialOverviewBox 
              cashInBank={cashInBank}
              creditCardDebt={creditCardDebt}
              outstandingInvoices={outstandingInvoices}
              networkExposure={networkExposure}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchDashboardData();
              }}
            />
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
              payrollData: expenseData || [],
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
            cashFlowData={cashManagementData}
            networkPaymentsData={networkPaymentsData}
            invoicesData={invoiceData}
          />
        );
  
      case 'financial-overview':
        return (
          <div className="space-y-6">
            <FinancialOverview 
              plData={plData}
              cashFlowData={cashManagementData}
              invoicesData={invoiceData}
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
              financialResources={rawData?.financialResources || []}
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
            <MonthlyExpenses expensesData={rawData?.monthlyExpenses || []} />
        </div>
        );
  
      case 'breakevenCalculator':
        return <BreakevenCalculator data={performanceData} />;
  
      default:
        return null;
    }
  };

  // Add useEffect to log state changes
  useEffect(() => {
    console.log('Tradeshift data state updated:', tradeshiftData);
  }, [tradeshiftData]);

  // Add this function to get the latest date from performance data
  const getLatestDataDate = (data) => {
    if (!data?.length) return new Date();
    
    const dates = data
      .map(entry => {
        if (!entry.Date) return null;
        const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day);
      })
      .filter(Boolean);
    
    return dates.length ? new Date(Math.max(...dates)) : new Date();
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