import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, ChevronDown, Brain, TrendingUp, DollarSign, Target, Calendar, ChartBar, BarChart2, Users } from 'lucide-react';
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
import ThirtyDayChallenge from '../components/dashboard/ThirtyDayChallenge';
import MediaBuyerProgress from '../components/dashboard/MediaBuyerProgress';
import CreditLineManager from '../components/dashboard/CreditLineManager';
import FinancialOverviewBox from '../components/dashboard/FinancialOverviewBox';
import AIInsightsPage from '../components/dashboard/AIInsightsPage';

export default function DashboardPage() {
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
  const [performanceData, setPerformanceData] = useState([]);
  const [cashManagementData, setCashManagementData] = useState(null);
  const [networkPaymentsData, setNetworkPaymentsData] = useState([]);
  const [invoicesData, setInvoicesData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [mediaBuyerData, setMediaBuyerData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [summaryData, setSummaryData] = useState([]);
  const [tradeshiftData, setTradeshiftData] = useState([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreButtonRef = useRef(null);

  const mainTabs = [
    { id: 'ai-insights', label: 'AI Insights', icon: Brain },
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
    { id: 'revenue-flow', label: 'Revenue Flow' },
    { id: 'cash-flow', label: 'Cash Flow' },
    { id: 'daily-spend', label: 'Daily Spend' },
    { id: 'bank-goals', label: 'Profit Distribution' },
    { id: 'tradeshift', label: 'Tradeshift Cards' }
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
              invoicesData={invoicesData}
              expenseData={payrollData}
            />
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
          invoicesData,
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
        const outstandingInvoices = (invoicesData || [])
          .filter(invoice => !invoice.paid && invoice.Amount > 0)
          .reduce((sum, invoice) => sum + (parseFloat(invoice.Amount) || 0), 0);
        const networkExposure = (rawData?.networkTerms || [])
          .reduce((sum, term) => sum + (parseFloat(term.runningTotal) || 0), 0);

        console.log('Calculated financial metrics:', {
          cashInBank,
          creditCardDebt,
          outstandingInvoices,
          networkExposure,
          invoiceCount: invoicesData?.length,
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
                fetchDashboardData().finally(() => {
                  setIsRefreshing(false);
                });
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
  
      case 'thirty-day-challenge':
        return (
          <div className="space-y-8">
            <CreditLineManager 
              performanceData={performanceData} 
              invoicesData={invoicesData} 
              creditCardData={rawData?.financialResources || []}
              payrollData={payrollData || []}
            />
            <ThirtyDayChallenge performanceData={performanceData} />
            <MediaBuyerProgress performanceData={performanceData} />
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

          {['network', 'media-buyers'].includes(activeTab) && (
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
}