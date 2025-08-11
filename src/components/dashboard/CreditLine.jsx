import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { RefreshCw, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const MONTHLY_EXPENSES = 65000;
const DAILY_EXPENSE_BUFFER = MONTHLY_EXPENSES / 30; // Daily expense consideration

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value) => {
  return `${(value * 100).toFixed(1)}%`;
};

const formatDate = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
};

const CreditLine = ({ data, loading, error }) => {
  // Debug logging for incoming data
  console.log('CreditLine received data:', {
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    cashFlowData: data?.cashFlowData,
    financialResources: data?.cashFlowData?.financialResources,
    cashAccounts: data?.cashFlowData?.financialResources?.cashAccounts,
    creditCards: data?.cashFlowData?.financialResources?.creditCards,
    performanceData: data?.performanceData,
    invoicesData: data?.invoicesData,
    payrollData: data?.payrollData
  });

  const calculateUtilization = (owing, limit) => {
    if (limit === 0) return '-';
    return formatPercent(owing / limit);
  };

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    if (!data) return null;

    const performanceData = data.performanceData || [];
    const invoicesData = data.invoicesData || [];
    const creditCardData = data.cashFlowData?.financialResources?.creditCards || [];
    const cashAccountData = data.cashFlowData?.financialResources?.cashAccounts || [];
    const payrollData = data.payrollData || [];

    // Calculate most recent day's total ad spend
    let lastDate = null;
    let lastDaySpend = 0;

    try {
      // Log the incoming performance data
      console.log('Performance data sample:', performanceData.slice(0, 3));
      console.log('Sample date format:', performanceData[0]?.Date);

      // First, find the most recent date
      const dates = performanceData
        .map(entry => {
          try {
            if (!entry.Date) return null;
            // Try MM/DD/YYYY format first
            const parts = entry.Date.split('/');
            if (parts.length === 3) {
              const [month, day, year] = parts.map(Number);
              return new Date(year, month - 1, day);
            }
            // If that fails, try direct parsing
            return new Date(entry.Date);
          } catch (e) {
            console.error('Error parsing date:', entry.Date, e);
            return null;
          }
        })
        .filter(date => date !== null && !isNaN(date.getTime()))
        .sort((a, b) => b - a);

      console.log('Sorted dates:', dates.map(d => d.toISOString()));
      
      lastDate = dates[0];

      if (lastDate) {
        // Format the date for comparison using the same format as the input data (MM/DD/YYYY)
        const lastDateStr = `${String(lastDate.getMonth() + 1).padStart(2, '0')}/${String(lastDate.getDate()).padStart(2, '0')}/${lastDate.getFullYear()}`;
        console.log('Looking for entries with date:', lastDateStr);
        
        // Log a few entries to see their date format
        console.log('Sample entries with dates:', performanceData.slice(0, 3).map(entry => ({
          date: entry.Date,
          spend: entry['Ad Spend']
        })));
        
        // Calculate spend for the last date - try multiple date formats
        let matchingEntries = performanceData.filter(entry => {
          // Try exact match first
          if (entry.Date === lastDateStr) return true;
          
          // Try to parse and compare dates
          try {
            if (!entry.Date) return false;
            const entryParts = entry.Date.split('/');
            if (entryParts.length === 3) {
              const [entryMonth, entryDay, entryYear] = entryParts.map(Number);
              const entryDate = new Date(entryYear, entryMonth - 1, entryDay);
              return entryDate.getTime() === lastDate.getTime();
            }
            return false;
          } catch {
            return false;
          }
        });

        // If no entries found, use the date object to find entries from the most recent date
        if (matchingEntries.length === 0) {
          console.log('No exact matches found, trying date object comparison');
          matchingEntries = performanceData.filter(entry => {
            try {
              if (!entry.Date) return false;
              const parts = entry.Date.split('/');
              if (parts.length === 3) {
                const [month, day, year] = parts.map(Number);
                const entryDate = new Date(year, month - 1, day);
                // Compare just the date parts
                return entryDate.getFullYear() === lastDate.getFullYear() && 
                       entryDate.getMonth() === lastDate.getMonth() && 
                       entryDate.getDate() === lastDate.getDate();
              }
              return false;
            } catch {
              return false;
            }
          });
        }
        
        console.log('Matching entries:', matchingEntries);
        
        if (matchingEntries.length > 0) {
          lastDaySpend = matchingEntries.reduce((sum, entry) => {
            try {
              const spend = typeof entry['Ad Spend'] === 'string' 
                ? parseFloat(entry['Ad Spend'].replace(/[^0-9.-]+/g, ''))
                : parseFloat(entry['Ad Spend'] || 0);
              return sum + (isNaN(spend) ? 0 : spend);
            } catch (e) {
              console.error('Error parsing spend:', entry['Ad Spend'], e);
              return sum;
            }
          }, 0);
        } else {
          console.log('No matching entries found for the most recent date');
        }

        console.log('Last day calculation:', {
          lastDate: lastDate?.toISOString(),
          lastDateStr,
          lastDaySpend,
          performanceDataLength: performanceData.length,
          matchingEntriesCount: matchingEntries.length,
          sampleData: performanceData[0],
          filteredData: matchingEntries
        });
      }
    } catch (error) {
      console.error('Error calculating last day spend:', error);
    }

    // Calculate total invoices owed (money coming in)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    // Group invoices by expected payment date
    const incomingPayments = invoicesData.reduce((acc, inv) => {
      const dueDate = new Date(inv.DueDate);
      if (dueDate <= thirtyDaysFromNow) {
        const amount = parseFloat(inv.Amount?.toString().replace(/[$,]/g, '') || '0');
        const weekNumber = Math.floor((dueDate - new Date()) / (7 * 24 * 60 * 60 * 1000));
        if (!acc[weekNumber]) acc[weekNumber] = 0;
        acc[weekNumber] += amount;
      }
      return acc;
    }, {});

    // Calculate credit card metrics and cash in bank
    const creditCardMetrics = { totalAvailable: 0, totalOwing: 0, totalLimit: 0 };
    let cashInBank = 0;

    // Define cash account names
    const cashAccountNames = ['Cash in Bank', 'Slash Account', 'Business Savings (JP MORGAN)'];

    // Process cash accounts
    cashAccountData.forEach(account => {
      const accountName = account.account || '';
      const available = parseFloat(account.available?.toString().replace(/[$,]/g, '') || '0');
      
      // Debug logging for cash accounts
      console.log('Processing cash account:', {
        accountName,
        available,
        rawAvailable: account.available,
        accountData: account,
        hasAvailable: 'available' in account,
        availableType: typeof account.available
      });
      
      // More flexible matching for cash accounts
      if (cashAccountNames.includes(accountName) || 
          accountName.toLowerCase().includes('cash') ||
          accountName.toLowerCase().includes('bank') ||
          accountName.toLowerCase().includes('savings') ||
          accountName.toLowerCase().includes('slash')) {
        cashInBank += available;
        console.log('Added to cashInBank:', { accountName, available, runningTotal: cashInBank });
      }
    });

    console.log('Cash accounts processing complete:', {
      totalCashAccounts: cashAccountData.length,
      cashInBank,
      allCashAccounts: cashAccountData.map(acc => ({
        name: acc.account,
        available: acc.available,
        parsed: parseFloat(acc.available?.toString().replace(/[$,]/g, '') || '0')
      }))
    });

    // Process credit cards
    creditCardData.forEach(account => {
      const available = parseFloat(account.available?.toString().replace(/[$,]/g, '') || '0');
      const owing = parseFloat(account.owing?.toString().replace(/[$,]/g, '') || '0');
      const limit = parseFloat(account.limit?.toString().replace(/[$,]/g, '') || '0');

      creditCardMetrics.totalAvailable += available;
      creditCardMetrics.totalOwing += owing;
      creditCardMetrics.totalLimit += limit;
    });

    // Group upcoming expenses by week
    const upcomingExpensesByWeek = payrollData.reduce((acc, expense) => {
      const dueDate = new Date(expense.DueDate);
      if (dueDate <= thirtyDaysFromNow) {
        const amount = parseFloat(expense.Amount?.toString().replace(/[$,]/g, '') || '0');
        const weekNumber = Math.floor((dueDate - new Date()) / (7 * 24 * 60 * 60 * 1000));
        if (!acc[weekNumber]) acc[weekNumber] = 0;
        acc[weekNumber] += amount;
      }
      return acc;
    }, {});

    // Calculate weekly cash flow projections
    const weeklyProjections = [];
    let runningBalance = cashInBank;
    const weeklyExpenseBuffer = MONTHLY_EXPENSES / 4; // Split monthly expenses into 4 weeks

    for (let week = 0; week < 4; week++) {
      const incomingThisWeek = incomingPayments[week] || 0;
      const expensesThisWeek = (upcomingExpensesByWeek[week] || 0) + weeklyExpenseBuffer;
      const netCashFlow = incomingThisWeek - expensesThisWeek;
      runningBalance += netCashFlow;

      weeklyProjections.push({
        week: week + 1,
        incomingPayments: incomingThisWeek,
        expenses: expensesThisWeek,
        netCashFlow,
        runningBalance
      });
    }
    
    // Calculate net available for spending considering weekly cash flows
    const totalAvailableFunds = cashInBank + creditCardMetrics.totalAvailable;
    const totalIncomingPayments = Object.values(incomingPayments).reduce((sum, amount) => sum + amount, 0);
    const totalUpcomingExpenses = Object.values(upcomingExpensesByWeek).reduce((sum, amount) => sum + amount, 0);
    
    const netAvailable = totalAvailableFunds + totalIncomingPayments - totalUpcomingExpenses - creditCardMetrics.totalOwing;
    
    // Calculate safe daily spending limit based on 30-day projection
    const safeSpendingLimit = (netAvailable * 0.8) / 30;
    
    return {
      cashInBank,
      creditCardMetrics,
      yesterdaySpend: lastDaySpend,
      lastDate,
      totalAvailableFunds,
      totalIncomingPayments,
      totalUpcomingExpenses,
      netAvailable,
      safeSpendingLimit,
      dailyExpenseBuffer: DAILY_EXPENSE_BUFFER,
      weeklyProjections
    };
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Line & Budget Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Line & Budget Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-4">
            Error loading data: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const financialResources = data?.cashFlowData?.financialResources || {};
  const allAccounts = [
    ...(financialResources.cashAccounts || []),
    ...(financialResources.creditCards || [])
  ];
  
  // Use the actual cash accounts from the API data structure
  const cashAccounts = financialResources.cashAccounts || [];
  const amexCards = allAccounts.filter(account => 
    account.account && account.account.includes('AMEX')
  );
  const chaseCards = allAccounts.filter(account => 
    account.account && account.account.includes('Chase')
  );
  const capitalOneCards = allAccounts.filter(account => 
    account.account && account.account.includes('Capital One')
  );
  const otherCards = allAccounts.filter(account => 
    account.account && 
    !['Cash in Bank', 'Slash Account', 'Business Savings (JP MORGAN)'].includes(account.account) &&
    !account.account.includes('AMEX') &&
    !account.account.includes('Chase') &&
    !account.account.includes('Capital One')
  );

  // Calculate totals using the correct data structure
  const totalCashAvailable = cashAccounts.reduce((sum, account) => {
    const available = parseFloat(account.available?.toString().replace(/[$,]/g, '') || '0');
    console.log(`Adding to totalCashAvailable: ${account.account} = ${available}`);
    return sum + available;
  }, 0);
  
  const totalAvailable = allAccounts.reduce((sum, account) => {
    const available = parseFloat(account.available?.toString().replace(/[$,]/g, '') || '0');
    return sum + available;
  }, 0);
  
  const totalOwing = allAccounts.reduce((sum, account) => {
    const owing = parseFloat(account.owing?.toString().replace(/[$,]/g, '') || '0');
    return sum + owing;
  }, 0);
  
  const totalCreditLimit = allAccounts.reduce((sum, account) => {
    const limit = parseFloat(account.limit?.toString().replace(/[$,]/g, '') || '0');
    return sum + limit;
  }, 0);

  console.log('CreditLine totals calculated:', {
    totalCashAvailable,
    totalAvailable,
    totalOwing,
    totalCreditLimit,
    cashAccountsCount: cashAccounts.length,
    allAccountsCount: allAccounts.length
  });

  // Calculate credit card metrics by issuer
  const creditCardData = useMemo(() => {
    const amexTotal = {
      name: 'Amex',
      limit: amexCards.reduce((sum, card) => sum + (parseFloat(card.limit?.toString().replace(/[$,]/g, '') || '0')), 0),
      owing: amexCards.reduce((sum, card) => sum + (parseFloat(card.owing?.toString().replace(/[$,]/g, '') || '0')), 0),
      available: amexCards.reduce((sum, card) => sum + (parseFloat(card.available?.toString().replace(/[$,]/g, '') || '0')), 0),
    };
    
    const chaseTotal = {
      name: 'Chase',
      limit: chaseCards.reduce((sum, card) => sum + (parseFloat(card.limit?.toString().replace(/[$,]/g, '') || '0')), 0),
      owing: chaseCards.reduce((sum, card) => sum + (parseFloat(card.owing?.toString().replace(/[$,]/g, '') || '0')), 0),
      available: chaseCards.reduce((sum, card) => sum + (parseFloat(card.available?.toString().replace(/[$,]/g, '') || '0')), 0),
    };
    
    const capitalOneTotal = {
      name: 'Capital One',
      limit: capitalOneCards.reduce((sum, card) => sum + (parseFloat(card.limit?.toString().replace(/[$,]/g, '') || '0')), 0),
      owing: capitalOneCards.reduce((sum, card) => sum + (parseFloat(card.owing?.toString().replace(/[$,]/g, '') || '0')), 0),
      available: capitalOneCards.reduce((sum, card) => sum + (parseFloat(card.available?.toString().replace(/[$,]/g, '') || '0')), 0),
    };
    
    const otherTotal = {
      name: 'Other',
      limit: otherCards.reduce((sum, card) => sum + (parseFloat(card.limit?.toString().replace(/[$,]/g, '') || '0')), 0),
      owing: otherCards.reduce((sum, card) => sum + (parseFloat(card.owing?.toString().replace(/[$,]/g, '') || '0')), 0),
      available: otherCards.reduce((sum, card) => sum + (parseFloat(card.available?.toString().replace(/[$,]/g, '') || '0')), 0),
    };

    return [amexTotal, chaseTotal, capitalOneTotal, otherTotal].filter(item => item.limit > 0);
  }, [amexCards, chaseCards, capitalOneCards, otherCards]);

  // Data for utilization pie chart
  const utilizationData = useMemo(() => {
    return creditCardData.map(card => ({
      name: card.name,
      value: card.limit > 0 ? (card.owing / card.limit) * 100 : 0
    }));
  }, [creditCardData]);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Custom tooltip for pie charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const value = data.value;
      const dataKey = data.dataKey;
      
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded text-sm">
          <p className="font-medium">{data.payload.name}</p>
          <p>
            {dataKey === "value" ? `${value.toFixed(1)}%` : formatCurrency(value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Line & Budget Manager</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Financial Resources Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Cash Available</p>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-semibold text-blue-600">{formatCurrency(totalCashAvailable)}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Credit Available</p>
              <CreditCard className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalAvailable - totalCashAvailable)}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Owing</p>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-semibold text-red-600">{formatCurrency(totalOwing)}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Credit Limit</p>
              <ArrowUpRight className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-semibold text-purple-600">{formatCurrency(totalCreditLimit)}</p>
          </div>
        </div>

        {/* Budget Management Section */}
        {financialMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Last Day's Ad Spend</p>
                <DollarSign className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(financialMetrics.yesterdaySpend)}</p>
              <p className="text-xs text-gray-500 mt-1">Total spend for {formatDate(financialMetrics.lastDate)}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Safe Daily Spending Limit</p>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(financialMetrics.safeSpendingLimit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Based on 30-day projection</p>
            </div>
            <div className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Daily Expense Buffer</p>
                <ArrowDownRight className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(financialMetrics.dailyExpenseBuffer)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Monthly expenses / 30</p>
            </div>
          </div>
        )}

        {/* Credit Card Allocation Charts */}
        {creditCardData.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Credit Card Allocation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Credit Limit Distribution */}
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Credit Limit Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={creditCardData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="limit"
                      >
                        {creditCardData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2 text-sm font-medium">
                  Total: {formatCurrency(totalCreditLimit)}
                </div>
              </div>

              {/* Amount Owing Distribution */}
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Spending Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={creditCardData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="owing"
                      >
                        {creditCardData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2 text-sm font-medium">
                  Total: {formatCurrency(totalOwing)}
                </div>
              </div>

              {/* Credit Utilization */}
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Credit Utilization (%)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={utilizationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {utilizationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2 text-sm font-medium">
                  Average: {formatPercent(totalOwing / totalCreditLimit)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Details Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account Name</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Available Amount</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount Owing</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Credit Limit</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Cash Accounts */}
              <tr className="bg-gray-50">
                <td colSpan="5" className="px-4 py-2 text-sm font-bold text-gray-700">Cash Accounts</td>
              </tr>
              {cashAccounts.map((account, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{account.account}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.available)}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.owing)}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.limit)}</td>
                  <td className="px-4 py-2 text-sm text-right">{calculateUtilization(account.owing, account.limit)}</td>
                </tr>
              ))}

              {/* AMEX Cards */}
              <tr className="bg-gray-50">
                <td colSpan="5" className="px-4 py-2 text-sm font-bold text-gray-700">AMEX Cards</td>
              </tr>
              {amexCards.map((account, index) => {
                // Add business name notes for specific cards
                let businessNote = '';
                if (account.account.includes('1003') || account.account.includes('1011')) {
                  businessNote = 'Convert 2 Freedom Tradeshift Account';
                } else if (account.account.includes('2006')) {
                  businessNote = 'Torson Enterprises Tradeshift Account';
                } else if (account.account.includes('1004')) {
                  businessNote = 'Rightway Marketing Tradeshift Account';
                } else if (account.account.includes('2007')) {
                  businessNote = 'Q9to5 Tradeshift Account';
                }

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      <div className="flex items-center">
                        {account.account}
                        {businessNote && (
                          <span className="ml-2 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            {businessNote}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.available)}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.owing)}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.limit)}</td>
                    <td className="px-4 py-2 text-sm text-right">{calculateUtilization(account.owing, account.limit)}</td>
                  </tr>
                );
              })}

              {/* Chase Cards */}
              <tr className="bg-gray-50">
                <td colSpan="5" className="px-4 py-2 text-sm font-bold text-gray-700">Chase Cards</td>
              </tr>
              {chaseCards.map((account, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{account.account}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.available)}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.owing)}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.limit)}</td>
                  <td className="px-4 py-2 text-sm text-right">{calculateUtilization(account.owing, account.limit)}</td>
                </tr>
              ))}

              {/* Capital One Cards */}
              <tr className="bg-gray-50">
                <td colSpan="5" className="px-4 py-2 text-sm font-bold text-gray-700">Capital One Cards</td>
              </tr>
              {capitalOneCards.map((account, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{account.account}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.available)}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.owing)}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.limit)}</td>
                  <td className="px-4 py-2 text-sm text-right">{calculateUtilization(account.owing, account.limit)}</td>
                </tr>
              ))}

              {/* Other Cards */}
              <tr className="bg-gray-50">
                <td colSpan="5" className="px-4 py-2 text-sm font-bold text-gray-700">Other Cards</td>
              </tr>
              {otherCards.map((account, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{account.account}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.available)}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.owing)}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(account.limit)}</td>
                  <td className="px-4 py-2 text-sm text-right">{calculateUtilization(account.owing, account.limit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditLine; 