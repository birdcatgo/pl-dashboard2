import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, ChevronDown, Brain, TrendingUp, DollarSign, Target, Calendar, ChartBar, BarChart2, Users, Receipt, Table, Clock, History, Calculator, FileText, LineChart, UserCheck, Wrench } from 'lucide-react';
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
import ExpenseOverview from './ExpenseOverview';
import RevenueFlowAnalysis from './RevenueFlowAnalysis';
import TradeshiftOverview from './TradeshiftOverview';
import CreditCardLimits from './CreditCardLimits';
import ThirtyDayChallenge from './ThirtyDayChallenge';
import MediaBuyerProgress from './MediaBuyerProgress';
import CreditLineManager from './CreditLineManager';
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
import { format } from 'date-fns';
import CommissionPayments from './CommissionPayments';
import MidDayCheckIn from './MidDayCheckIn';
import TodaysTrend from './TodaysTrend';
import DailyTrends from './DailyTrends';
import TrendHistory from './TrendHistory';
import { Button } from "@/components/ui/button";
import ContractorContracts from './ContractorContracts';
import { NDA_TEMPLATE, APPENDIX_A_FIRST_30_DAYS, APPENDIX_B_POST_30_DAYS } from '@/lib/contract-templates';
import { MEDIA_BUYER_CONTRACTOR_AGREEMENT } from '@/lib/contract-templates';
import TimezoneConverter from './TimezoneConverter';
import AdAccounts from './AdAccounts';
import DailyUpdate from './DailyUpdate';
import ExpenseReview from './ExpenseReview';
import TradeshiftReview from './TradeshiftReview';
import DailyPLUpdate from './DailyPLUpdate';

export default function DashboardLayout({ 
  performanceData, 
  invoiceData, 
  expenseData, 
  cashFlowData,
  networkTermsData,
  tradeshiftData: initialTradeshiftData,
  plData: initialPlData,
  employeeData
}) {
  const [activeTab, setActiveTab] = useState('dashboard-index');
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
  const [accountingSubview, setAccountingSubview] = useState('net-profit');
  const [accountsSubview, setAccountsSubview] = useState('invoices');
  const [reportingSubview, setReportingSubview] = useState('eod-report');
  const [redtrackSubview, setRedtrackSubview] = useState('midday-checkin');
  const [contractorSubview, setContractorSubview] = useState('contracts');
  const [toolsSubview, setToolsSubview] = useState('daily-update');

  // Update state when props change
  useEffect(() => {
    setTradeshiftData(initialTradeshiftData || []);
  }, [initialTradeshiftData]);

  useEffect(() => {
    setPlData(initialPlData || null);
  }, [initialPlData]);

  // Set up initial data
  useEffect(() => {
    if (performanceData?.data && invoiceData && expenseData && cashFlowData) {
      console.log('Setting up dashboard with data:', {
        hasPerformanceData: !!performanceData?.data,
        performanceDataLength: performanceData?.data?.length,
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
  }, [performanceData?.data, invoiceData, expenseData, cashFlowData, tradeshiftData, plData]);

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
    { id: 'dashboard-index', label: 'Dashboard Index', icon: Brain },
    { id: 'accounting', label: 'Profit Metrics', icon: Calculator },
    { id: 'accounts', label: 'Accounts Receivable & Payable', icon: FileText },
    { id: 'reporting', label: 'Reporting', icon: LineChart },
    { id: 'contractor-info', label: 'Contractor Information', icon: UserCheck },
    { id: 'tools', label: 'Tools', icon: Wrench }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard-index':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Dashboard Index" 
              subtitle="Quick access to all dashboard views and features"
              icon={Brain}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profit Metrics Section */}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Profit Metrics</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveTab('accounting');
                      setAccountingSubview('net-profit');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🔮</span>
                      <div>
                        <h3 className="font-medium">Net Profit</h3>
                        <p className="text-sm text-gray-600">Predicts future performance based on trends and targets</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('accounting');
                      setAccountingSubview('pl');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">💵</span>
                      <div>
                        <h3 className="font-medium">Cash View (Money In/Out)</h3>
                        <p className="text-sm text-gray-600">Track actual money received and paid</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('accounting');
                      setAccountingSubview('media-buyer-pl');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <h3 className="font-medium">Performance View</h3>
                        <p className="text-sm text-gray-600">Revenue earned based on delivered leads</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('accounting');
                      setAccountingSubview('credit-line');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">💳</span>
                      <div>
                        <h3 className="font-medium">Credit Line & Budget Manager</h3>
                        <p className="text-sm text-gray-600">Monitor credit limits and spending thresholds</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Accounts Section */}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Accounts</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveTab('accounts');
                      setAccountsSubview('invoices');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📄</span>
                      <div>
                        <h3 className="font-medium">Invoices (Receivable)</h3>
                        <p className="text-sm text-gray-600">Track and manage incoming payments</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('accounts');
                      setAccountsSubview('expenses');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">💰</span>
                      <div>
                        <h3 className="font-medium">Upcoming Expenses (Payable)</h3>
                        <p className="text-sm text-gray-600">Manage and track outgoing payments</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('accounts');
                      setAccountsSubview('expense-overview');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <h3 className="font-medium">Expense Overview</h3>
                        <p className="text-sm text-gray-600">Analyze expense patterns and categories</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('accounts');
                      setAccountsSubview('expense-review');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📅</span>
                      <div>
                        <h3 className="font-medium">Expense Review</h3>
                        <p className="text-sm text-gray-600">Review and analyze expenses</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('accounts');
                      setAccountsSubview('tradeshift-review');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📅</span>
                      <div>
                        <h3 className="font-medium">Tradeshift Review</h3>
                        <p className="text-sm text-gray-600">Review and analyze tradeshift data</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('accounts');
                      setAccountsSubview('commissions');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">💸</span>
                      <div>
                        <h3 className="font-medium">Commission Payments</h3>
                        <p className="text-sm text-gray-600">Track and manage commission payouts</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Reporting Section */}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Reporting</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveTab('reporting');
                      setReportingSubview('eod-report');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <h3 className="font-medium">EOD Report</h3>
                        <p className="text-sm text-gray-600">Daily performance summary and analysis</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('reporting');
                      setReportingSubview('offer-performance');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📈</span>
                      <div>
                        <h3 className="font-medium">Offer Performance</h3>
                        <p className="text-sm text-gray-600">Track offer metrics and network caps</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('reporting');
                      setReportingSubview('media-buyers');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">👥</span>
                      <div>
                        <h3 className="font-medium">Media Buyers</h3>
                        <p className="text-sm text-gray-600">Media buyer performance and challenges</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('reporting');
                      setReportingSubview('redtrack');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">⏰</span>
                      <div>
                        <h3 className="font-medium">Redtrack Check In</h3>
                        <p className="text-sm text-gray-600">Track campaign performance throughout the day</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('reporting');
                      setReportingSubview('highlights');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">✨</span>
                      <div>
                        <h3 className="font-medium">Highlights</h3>
                        <p className="text-sm text-gray-600">Key performance highlights and insights</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Contractor Information Section */}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Contractor Information</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveTab('contractor-info');
                      setContractorSubview('contracts');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📝</span>
                      <div>
                        <h3 className="font-medium">Contractor Contracts</h3>
                        <p className="text-sm text-gray-600">Manage and download contracts for contractors</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('contractor-info');
                      setContractorSubview('nda');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🔒</span>
                      <div>
                        <h3 className="font-medium">NDA Template</h3>
                        <p className="text-sm text-gray-600">Non-Disclosure Agreement for contractors</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('contractor-info');
                      setContractorSubview('media-buyer');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <h3 className="font-medium">Media Buyer Agreement</h3>
                        <p className="text-sm text-gray-600">Contract template for media buyers</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('contractor-info');
                      setContractorSubview('30-day');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📅</span>
                      <div>
                        <h3 className="font-medium">30 Day Contract</h3>
                        <p className="text-sm text-gray-600">First 30 days agreement template</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('contractor-info');
                      setContractorSubview('post-30-day');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📆</span>
                      <div>
                        <h3 className="font-medium">Post 30 Day Contract</h3>
                        <p className="text-sm text-gray-600">Contract template after initial 30 days</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tools Section */}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Tools</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveTab('tools');
                      setToolsSubview('daily-update');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📝</span>
                      <div>
                        <h3 className="font-medium">Daily Updates</h3>
                        <p className="text-sm text-gray-600">Create and send slack updates</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('tools');
                      setToolsSubview('daily-pl-update');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <h3 className="font-medium">Daily P&L Update</h3>
                        <p className="text-sm text-gray-600">Track and report daily P&L</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('tools');
                      setToolsSubview('ad-accounts');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🎯</span>
                      <div>
                        <h3 className="font-medium">Ad Accounts</h3>
                        <p className="text-sm text-gray-600">Manage and monitor ad accounts</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('tools');
                      setToolsSubview('timezone');
                    }}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">⏰</span>
                      <div>
                        <h3 className="font-medium">Timezone Converter</h3>
                        <p className="text-sm text-gray-600">Convert between NZT and PST</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'accounting':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Profit Metrics" 
              subtitle="Financial performance analysis across different views"
              icon={Calculator}
            />
            
            {/* Profit Metrics Subviews Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
              <div className="space-y-6">
                <div className="flex space-x-4">
                  <Button
                    variant={accountingSubview === 'net-profit' ? 'default' : 'outline'}
                    onClick={() => setAccountingSubview('net-profit')}
                    className={`flex items-center ${
                      accountingSubview === 'net-profit' 
                        ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200' 
                        : 'hover:bg-purple-50'
                    }`}
                  >
                    🔮 Forecasting View
                  </Button>
                  <Button
                    variant={accountingSubview === 'pl' ? 'default' : 'outline'}
                    onClick={() => setAccountingSubview('pl')}
                    className={`flex items-center ${
                      accountingSubview === 'pl' 
                        ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' 
                        : 'hover:bg-blue-50'
                    }`}
                  >
                    💵 Cash View (Money In/Out)
                  </Button>
                  <Button
                    variant={accountingSubview === 'media-buyer-pl' ? 'default' : 'outline'}
                    onClick={() => setAccountingSubview('media-buyer-pl')}
                    className={`flex items-center ${
                      accountingSubview === 'media-buyer-pl' 
                        ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                        : 'hover:bg-green-50'
                    }`}
                  >
                    📊 Performance View
                  </Button>
                  <Button
                    variant={accountingSubview === 'credit-line' ? 'default' : 'outline'}
                    onClick={() => setAccountingSubview('credit-line')}
                    className={`flex items-center ${
                      accountingSubview === 'credit-line' 
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' 
                        : 'hover:bg-yellow-50'
                    }`}
                  >
                    💳 Credit Line & Budget Manager
                  </Button>
                </div>

                {/* View Description */}
                <div className="bg-gray-50 rounded-lg p-4">
                  {accountingSubview === 'net-profit' && (
                    <div className="space-y-4">
                      <p className="text-gray-700">
                        Predicts future performance based on trends, targets, and expected spend.
                        Use this to plan ahead — it estimates future profit based on current ROI, average daily revenue, and projected ad spend. Great for tracking whether we're on pace to hit monthly goals.
                      </p>
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Includes:</p>
                        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                          <li>Revenue projections (daily, weekly, EOM)</li>
                          <li>Spend forecasts</li>
                          <li>Estimated commissions and payouts</li>
                          <li>Expected profit margin</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {accountingSubview === 'pl' && (
                    <div className="space-y-4">
                      <p className="text-gray-700">
                        Tracks actual money that has come in and gone out.
                        This is our true Profit & Loss — what we've actually received from networks and what we've actually paid (ad spend, commissions, SaaS tools, etc). It reflects bank balance reality, not just earned figures.
                      </p>
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Includes:</p>
                        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                          <li>Revenue received this month</li>
                          <li>All business expenses paid</li>
                          <li>Net profit (cash-based)</li>
                          <li>Breakeven tracking</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {accountingSubview === 'media-buyer-pl' && (
                    <div className="space-y-4">
                      <p className="text-gray-700">
                        Shows how much revenue we've earned based on delivered leads — regardless of payment timing.
                        This reflects how our campaigns are performing, not whether we've been paid yet. It's useful for ROI decisions, buyer tracking, and scaling.
                      </p>
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Includes:</p>
                        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                          <li>Earned revenue (accrual-based)</li>
                          <li>Spend to generate it</li>
                          <li>Commission-adjusted profit</li>
                          <li>ROI and profit per campaign/media buyer</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {accountingSubview === 'credit-line' && (
                    <div className="space-y-4">
                      <p className="text-gray-700">
                        Real-time view of available cash, credit limits, daily spend, and safe spending thresholds. Helps protect your ad accounts while maximizing growth.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Render the appropriate subview content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              {accountingSubview === 'net-profit' && (
            <NetProfit
                  performanceData={performanceData?.data || []}
              dateRange={dateRange}
              cashFlowData={{
                ...cashFlowData,
                networkTerms: networkTermsData
              }}
            />
              )}
              {accountingSubview === 'pl' && (
                <ImprovedPLDashboard 
                  plData={plData}
                  summaryData={plData?.summary || []}
                />
              )}
              {accountingSubview === 'media-buyer-pl' && (
                <MediaBuyerPL performanceData={performanceData?.data || []} />
              )}
              {accountingSubview === 'credit-line' && (
                <CreditLine 
                  data={{
                    performanceData: performanceData?.data || [],
                    invoicesData: invoiceData,
                    cashFlowData,
                    payrollData: expenseData
                  }}
                  loading={isRefreshing}
                  error={error}
                />
              )}
            </div>
          </div>
        );
      case 'reporting':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Reporting" 
              subtitle="Performance reports and analytics"
              icon={LineChart}
            />
            
            {/* Reporting Subviews Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex space-x-4">
                <Button
                  variant={reportingSubview === 'eod-report' ? 'default' : 'outline'}
                  onClick={() => setReportingSubview('eod-report')}
                >
                  EOD Report
                </Button>
                <Button
                  variant={reportingSubview === 'offer-performance' ? 'default' : 'outline'}
                  onClick={() => setReportingSubview('offer-performance')}
                >
                  Offer Performance
                </Button>
                <Button
                  variant={reportingSubview === 'media-buyers' ? 'default' : 'outline'}
                  onClick={() => setReportingSubview('media-buyers')}
                >
                  Media Buyers
                </Button>
                <Button
                  variant={reportingSubview === 'redtrack' ? 'default' : 'outline'}
                  onClick={() => setReportingSubview('redtrack')}
                >
                  Redtrack Check In
                </Button>
                <Button
                  variant={reportingSubview === 'highlights' ? 'default' : 'outline'}
                  onClick={() => setReportingSubview('highlights')}
                >
                  Highlights
                </Button>
              </div>
            </div>

            {/* Render the appropriate subview content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              {reportingSubview === 'eod-report' && (
                <EODReport performanceData={performanceData?.data || []} />
              )}
              {reportingSubview === 'offer-performance' && (
                <div className="space-y-8">
                  <OfferPerformance 
                    performanceData={performanceData?.data || []}
                    dateRange={dateRange}
                  />
                  <div className="mt-8 pt-8 border-t">
                    <h3 className="text-lg font-semibold mb-4">Network Caps</h3>
                    <NetworkCapsTab 
                      networkTerms={networkTermsData || []}
                    />
                  </div>
                </div>
              )}
              {reportingSubview === 'media-buyers' && (
                <div className="space-y-8">
                  <MediaBuyerPerformance 
                    performanceData={performanceData?.data || []}
                    dateRange={dateRange}
                  />
                  <div className="mt-8 pt-8 border-t">
                    <h3 className="text-lg font-semibold mb-4">30 Day Challenge</h3>
                    <div className="space-y-8">
                      <ThirtyDayChallenge performanceData={performanceData?.data || []} />
                      <MediaBuyerProgress performanceData={performanceData?.data || []} />
                    </div>
                  </div>
                </div>
              )}
              {reportingSubview === 'redtrack' && (
                <div className="space-y-6">
                  {/* Redtrack Subviews Navigation */}
                  <div className="flex space-x-4 mb-6">
                    <Button
                      variant={redtrackSubview === 'midday-checkin' ? 'default' : 'outline'}
                      onClick={() => setRedtrackSubview('midday-checkin')}
                    >
                      Mid-Day Check In
                    </Button>
                    <Button
                      variant={redtrackSubview === 'todays-trend' ? 'default' : 'outline'}
                      onClick={() => setRedtrackSubview('todays-trend')}
                    >
                      Today's Trend
                    </Button>
                    <Button
                      variant={redtrackSubview === 'daily-trends' ? 'default' : 'outline'}
                      onClick={() => setRedtrackSubview('daily-trends')}
                    >
                      Daily Trends History
                    </Button>
                    <Button
                      variant={redtrackSubview === 'trend-history' ? 'default' : 'outline'}
                      onClick={() => setRedtrackSubview('trend-history')}
                    >
                      Trend History
                    </Button>
                  </div>

                  {redtrackSubview === 'midday-checkin' && <MidDayCheckIn />}
                  {redtrackSubview === 'todays-trend' && <TodaysTrend />}
                  {redtrackSubview === 'daily-trends' && <DailyTrends />}
                  {redtrackSubview === 'trend-history' && <TrendHistory />}
                </div>
              )}
              {reportingSubview === 'highlights' && (
                <div className="space-y-6">
                  <Highlights performanceData={performanceData?.data || []} />
                </div>
              )}
            </div>
          </div>
        );
      case 'accounts':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Accounts Receivable & Payable" 
              subtitle="Track and manage invoices, expenses, and financial obligations"
              icon={FileText}
            />
            
            {/* Accounts Subviews Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex space-x-4">
                <Button
                  variant={accountsSubview === 'invoices' ? 'default' : 'outline'}
                  onClick={() => setAccountsSubview('invoices')}
                >
                  Invoices
                </Button>
                <Button
                  variant={accountsSubview === 'expenses' ? 'default' : 'outline'}
                  onClick={() => setAccountsSubview('expenses')}
                >
                  Upcoming Expenses
                </Button>
                <Button
                  variant={accountsSubview === 'expense-overview' ? 'default' : 'outline'}
                  onClick={() => setAccountsSubview('expense-overview')}
                >
                  Expense Overview
                </Button>
                <Button
                  variant={accountsSubview === 'expense-review' ? 'default' : 'outline'}
                  onClick={() => setAccountsSubview('expense-review')}
                >
                  Expense Review
                </Button>
                <Button
                  variant={accountsSubview === 'tradeshift-review' ? 'default' : 'outline'}
                  onClick={() => setAccountsSubview('tradeshift-review')}
                >
                  Tradeshift Review
                </Button>
                <Button
                  variant={accountsSubview === 'commissions' ? 'default' : 'outline'}
                  onClick={() => setAccountsSubview('commissions')}
                >
                  Commissions
                </Button>
              </div>
            </div>

            {/* Render the appropriate subview content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              {accountsSubview === 'invoices' && (
                <InvoicesTable data={invoiceData || []} />
              )}
              {accountsSubview === 'expenses' && (
                <UpcomingExpensesTable data={expenseData || []} />
              )}
              {accountsSubview === 'expense-overview' && (
                <ExpenseOverview 
                  plData={plData}
                  cashFlowData={cashFlowData}
                  invoicesData={invoiceData}
                  networkTerms={networkTermsData || []}
                />
              )}
              {accountsSubview === 'expense-review' && (
                <ExpenseReview plData={plData} />
              )}
              {accountsSubview === 'tradeshift-review' && (
                <TradeshiftReview tradeshiftData={tradeshiftData || []} />
              )}
              {accountsSubview === 'commissions' && (
                <CommissionPayments commissions={performanceData?.commissions || []} />
              )}
            </div>
          </div>
        );
      case 'revenue-flow':
        return (
          <RevenueFlowAnalysis 
            performanceData={performanceData?.data || []}
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
      case 'monthly-expenses':
        return (
          <div className="space-y-6">
            <MonthlyExpenses expensesData={expenseData || []} />
          </div>
        );
      case 'breakevenCalculator':
        return <BreakevenCalculator data={performanceData?.data || []} />;
      case 'daily-spend':
        return (
          <DailySpendCalculatorTab 
            cashManagementData={cashFlowData}
            performanceData={performanceData?.data || []}
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
      case 'network':
        return (
          <div className="space-y-6">
            <OfferPerformance 
              performanceData={performanceData?.data || []}
              dateRange={dateRange}
            />
          </div>
        );
      case 'commissions':
        return null;
      case 'midday-checkin':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Mid-Day Check-In" 
              subtitle="Track and review campaign performance throughout the day"
              icon={Clock}
            />
            <MidDayCheckIn />
          </div>
        );
      case 'todays-trend':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Today's Campaign Trends" 
              subtitle="Track campaign performance throughout the day"
              icon={TrendingUp}
            />
            <TodaysTrend />
          </div>
        );
      case 'daily-trends':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Daily Trends History" 
              subtitle="Historical campaign performance trends by day"
              icon={History}
            />
            <DailyTrends />
          </div>
        );
      case 'network-caps':
        return (
          <NetworkCapsTab 
            networkTerms={networkTermsData || []}
          />
        );
      case 'thirty-day-challenge':
        return (
          <div className="space-8">
            <ThirtyDayChallenge performanceData={performanceData?.data || []} />
            <MediaBuyerProgress performanceData={performanceData?.data || []} />
          </div>
        );
      case 'contractor-info':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Contractor Information" 
              subtitle="Manage contractor contracts and documentation"
              icon={UserCheck}
            />
            
            {/* Contractor Information Subviews Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex space-x-4">
                <Button
                  variant={contractorSubview === 'contracts' ? 'default' : 'outline'}
                  onClick={() => setContractorSubview('contracts')}
                >
                  Contractor Contracts
                </Button>
                <Button
                  variant={contractorSubview === 'nda' ? 'default' : 'outline'}
                  onClick={() => setContractorSubview('nda')}
                >
                  NDA Template
                </Button>
                <Button
                  variant={contractorSubview === 'media-buyer' ? 'default' : 'outline'}
                  onClick={() => setContractorSubview('media-buyer')}
                >
                  Media Buyer Agreement
                </Button>
                <Button
                  variant={contractorSubview === '30-day' ? 'default' : 'outline'}
                  onClick={() => setContractorSubview('30-day')}
                >
                  30 Day Contract
                </Button>
                <Button
                  variant={contractorSubview === 'post-30-day' ? 'default' : 'outline'}
                  onClick={() => setContractorSubview('post-30-day')}
                >
                  Post 30 Day Contract
                </Button>
              </div>
            </div>

            {/* Render the appropriate subview content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              {contractorSubview === 'contracts' && (
                <ContractorContracts contractorData={employeeData} />
              )}
              {contractorSubview === 'nda' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Non-Disclosure Agreement Template</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {NDA_TEMPLATE}
                    </pre>
                  </div>
                </div>
              )}
              {contractorSubview === 'media-buyer' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Media Buyer Agreement Template</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {MEDIA_BUYER_CONTRACTOR_AGREEMENT}
                    </pre>
                  </div>
                </div>
              )}
              {contractorSubview === '30-day' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">30 Day Contract Template</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {APPENDIX_A_FIRST_30_DAYS}
                    </pre>
                  </div>
                </div>
              )}
              {contractorSubview === 'post-30-day' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Post 30 Day Contract Template</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {APPENDIX_B_POST_30_DAYS}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'timezone':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Timezone Converter" 
              subtitle="Convert between different timezones and manage daylight savings"
              icon={Clock}
            />
            <TimezoneConverter />
          </div>
        );
      case 'ad-accounts':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Ad Accounts" 
              subtitle="Manage and monitor ad accounts"
              icon={Users}
            />
            <AdAccounts />
          </div>
        );
      case 'daily-update':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Daily Updates" 
              subtitle="Create and send slack updates"
              icon={FileText}
            />
            <DailyUpdate />
          </div>
        );
      case 'tools':
        return (
          <div className="space-y-8">
            <PageHeader 
              title="Tools" 
              subtitle="Utility tools and helpers"
              icon={Wrench}
            />
            
            {/* Tools Subviews Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex space-x-4">
                <Button
                  variant={toolsSubview === 'daily-update' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveTab('tools');
                    setToolsSubview('daily-update');
                  }}
                >
                  Daily Updates
                </Button>
                <Button
                  variant={toolsSubview === 'daily-pl-update' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveTab('tools');
                    setToolsSubview('daily-pl-update');
                  }}
                >
                  Daily P&L Update
                </Button>
                <Button
                  variant={toolsSubview === 'ad-accounts' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveTab('tools');
                    setToolsSubview('ad-accounts');
                  }}
                >
                  Ad Accounts
                </Button>
                <Button
                  variant={toolsSubview === 'timezone' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveTab('tools');
                    setToolsSubview('timezone');
                  }}
                >
                  Timezone Converter
                </Button>
              </div>
            </div>

            {/* Render the appropriate subview content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              {toolsSubview === 'daily-update' && <DailyUpdate />}
              {toolsSubview === 'daily-pl-update' && <DailyPLUpdate performanceData={performanceData} />}
              {toolsSubview === 'ad-accounts' && <AdAccounts />}
              {toolsSubview === 'timezone' && <TimezoneConverter />}
            </div>
          </div>
        );
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
    
    return new Date(Math.max(...dates.map(d => d.getTime())));
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
                  Last Updated: {format(lastUpdated, 'MMM d, yyyy h:mm a')}
              </div>
            )}
          </div>
        </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-700/50">
            <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
              {mainTabs.map((tab) => {
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
                  latestDate={getLatestDataDate(performanceData?.data)}
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