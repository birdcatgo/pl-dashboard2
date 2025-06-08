import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Brain, TrendingUp, DollarSign, Target, Calendar, ChartBar, BarChart2, Users, Receipt, Table, Clock, History, Calculator, FileText, LineChart, UserCheck, Wrench } from 'lucide-react';
import { debounce } from 'lodash';
import EnhancedDateSelector from './EnhancedDateSelector';
import CompactDateSelector from '../ui/CompactDateSelector';
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
import CommentRevenueAnalysis from './CommentRevenueAnalysis';
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
import CashFlowPlanner from './CashFlowPlanner';
import NetworkPayTerms from './NetworkPayTerms';
import DashboardHeader from '../ui/DashboardHeader';

// Import View Components
import DashboardIndexView from './views/DashboardIndexView';
import ProfitMetricsView from './views/ProfitMetricsView';
import AccountsView from './views/AccountsView';
import ReportingView from './views/ReportingView';
import ContractorView from './views/ContractorView';
import ToolsView from './views/ToolsView';

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
  const [dateRange, setDateRange] = useState(() => {
    // Calculate the most recent 7 days based on available performance data
    if (performanceData?.data?.length) {
      // Get all unique dates from the data and sort them
      const availableDates = [...new Set(performanceData.data
        .map(entry => entry.Date)
        .filter(Boolean))]
        .map(dateStr => {
          try {
            // Handle MM/DD/YYYY format
            if (dateStr.includes('/')) {
              const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
              return new Date(year, month - 1, day);
            }
            // Handle other formats
            return new Date(dateStr);
          } catch (e) {
            return null;
          }
        })
        .filter(date => date && !isNaN(date.getTime()))
        .sort((a, b) => b - a); // Sort in descending order (newest first)

      if (availableDates.length > 0) {
        const mostRecentDate = availableDates[0];
        // Get dates from the last 7 days of available data
        const last7Days = availableDates.slice(0, 7);
        const oldestInRange = last7Days[last7Days.length - 1] || mostRecentDate;
        
        return {
          startDate: new Date(oldestInRange.getFullYear(), oldestInRange.getMonth(), oldestInRange.getDate()),
          endDate: new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), mostRecentDate.getDate(), 23, 59, 59),
          period: 'last7'
        };
      }
    }
    
    // Fallback to last 7 days from now if no data available yet
    const now = new Date();
    const sixDaysAgo = new Date(now);
    sixDaysAgo.setDate(now.getDate() - 6);
    
    return {
      startDate: new Date(sixDaysAgo.getFullYear(), sixDaysAgo.getMonth(), sixDaysAgo.getDate()),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      period: 'last7'
    };
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

  // Update dateRange when performance data changes
  useEffect(() => {
    if (performanceData?.data?.length) {
      // Get all unique dates from the data and sort them
      const availableDates = [...new Set(performanceData.data
        .map(entry => entry.Date)
        .filter(Boolean))]
        .map(dateStr => {
          try {
            // Handle MM/DD/YYYY format
            if (dateStr.includes('/')) {
              const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
              return new Date(year, month - 1, day);
            }
            // Handle other formats
            return new Date(dateStr);
          } catch (e) {
            return null;
          }
        })
        .filter(date => date && !isNaN(date.getTime()))
        .sort((a, b) => b - a); // Sort in descending order (newest first)

      if (availableDates.length > 0) {
        const mostRecentDate = availableDates[0];
        // Get dates from the last 7 days of available data
        const last7Days = availableDates.slice(0, 7);
        const oldestInRange = last7Days[last7Days.length - 1] || mostRecentDate;
        
        setDateRange({
          startDate: new Date(oldestInRange.getFullYear(), oldestInRange.getMonth(), oldestInRange.getDate()),
          endDate: new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), mostRecentDate.getDate(), 23, 59, 59),
          period: 'last7'
        });
      }
    }
  }, [performanceData?.data]);

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

  // Add this function to get the latest date from performance data
  const getLatestDataDate = (data) => {
    if (!data?.length) return new Date(); // fallback to today
    const dates = data
      .map(entry => {
        if (!entry.Date) return null;
        const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
        const d = new Date(year, month - 1, day);
        return isNaN(d.getTime()) ? null : d;
      })
      .filter(Boolean);
    if (!dates.length) return new Date(); // fallback to today
    return new Date(Math.max(...dates.map(d => d.getTime())));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard-index':
        return (
          <DashboardIndexView 
            setActiveTab={setActiveTab}
            setAccountingSubview={setAccountingSubview}
            setAccountsSubview={setAccountsSubview}
            setReportingSubview={setReportingSubview}
            setContractorSubview={setContractorSubview}
            setToolsSubview={setToolsSubview}
          />
        );

      case 'accounting':
        return (
          <ProfitMetricsView 
            accountingSubview={accountingSubview}
            setAccountingSubview={setAccountingSubview}
            performanceData={performanceData}
            dateRange={dateRange}
            cashFlowData={cashFlowData}
            networkTermsData={networkTermsData}
            plData={plData}
            invoiceData={invoiceData}
            expenseData={expenseData}
            isRefreshing={isRefreshing}
            error={error}
          />
        );

      case 'reporting':
        return (
          <ReportingView 
            reportingSubview={reportingSubview}
            setReportingSubview={setReportingSubview}
            performanceData={performanceData}
            dateRange={dateRange}
            handleDateChange={handleDateChange}
            getLatestDataDate={getLatestDataDate}
            networkTermsData={networkTermsData}
          />
        );

      case 'accounts':
        return (
          <AccountsView 
            accountsSubview={accountsSubview}
            setAccountsSubview={setAccountsSubview}
            invoiceData={invoiceData}
            expenseData={expenseData}
            plData={plData}
            cashFlowData={cashFlowData}
            networkTermsData={networkTermsData}
            tradeshiftData={tradeshiftData}
            performanceData={performanceData}
          />
        );

      case 'contractor-info':
        return (
          <ContractorView 
            contractorSubview={contractorSubview}
            setContractorSubview={setContractorSubview}
            employeeData={employeeData}
          />
        );

      case 'tools':
        return (
          <ToolsView 
            toolsSubview={toolsSubview}
            setToolsSubview={setToolsSubview}
            performanceData={performanceData}
            cashFlowData={cashFlowData}
            expenseData={expenseData}
            invoiceData={invoiceData}
            networkTermsData={networkTermsData}
          />
        );

      // Legacy cases that need to be handled for compatibility
      case 'revenue-flow':
        return (
          <RevenueFlowAnalysis 
            performanceData={performanceData?.data || []}
            networkTerms={networkTermsData}
            invoicesData={invoiceData}
            plData={plData}
          />
        );
      case 'comment-revenue':
        return (
          <CommentRevenueAnalysis 
            performanceData={performanceData}
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
      case 'thirty-day-challenge':
        return (
          <div className="space-8">
            <ThirtyDayChallenge performanceData={performanceData?.data || []} />
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
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
      <DashboardHeader 
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

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