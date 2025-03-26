import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const MONTHLY_EXPENSES = 65000;
const DAILY_EXPENSE_BUFFER = MONTHLY_EXPENSES / 30; // Daily expense consideration

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const CreditLineManager = ({ performanceData, invoicesData = [], creditCardData = [], payrollData = [] }) => {
  console.log('CreditLineManager received data:', {
    performanceData: {
      length: performanceData?.length,
      sample: performanceData?.[0]
    },
    invoicesData: {
      length: invoicesData?.length,
      sample: invoicesData?.[0]
    },
    creditCardData: {
      length: creditCardData?.length,
      sample: creditCardData?.[0],
      allAccounts: creditCardData.map(card => ({
        account: card.account,
        available: card.available,
        type: card.type
      }))
    },
    payrollData: {
      length: payrollData?.length,
      sample: payrollData?.[0]
    }
  });

  // Calculate last 7 days metrics for each media buyer
  const mediaMetrics = useMemo(() => {
    if (!performanceData?.length) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Group by media buyer and offer
    const buyerMetrics = performanceData
      .filter(entry => {
        const [month, day, year] = entry.Date.split('/');
        const entryDate = new Date(year, month - 1, day);
        return entryDate >= sevenDaysAgo;
      })
      .reduce((acc, entry) => {
        const buyer = entry['Media Buyer'];
        const offer = entry.Offer;
        const key = `${buyer}-${offer}`;

        if (!acc[key]) {
          acc[key] = {
            buyer,
            offer,
            spend: 0,
            revenue: 0,
            profit: 0,
            days: new Set(),
          };
        }

        acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
        acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
        acc[key].profit += parseFloat(entry.Margin || 0);
        acc[key].days.add(entry.Date);

        return acc;
      }, {});

    // Calculate daily averages and ROI
    return Object.values(buyerMetrics).map(metric => ({
      ...metric,
      daysCount: metric.days.size,
      dailyAvgSpend: metric.spend / metric.days.size,
      roi: ((metric.revenue / metric.spend) - 1) * 100,
      suggestedIncrease: metric.profit > 0 && metric.revenue / metric.spend > 1.2
    }));
  }, [performanceData]);

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    // Calculate most recent day's total ad spend
    const lastDate = performanceData
      .map(entry => entry.Date)
      .sort((a, b) => {
        const [aMonth, aDay, aYear] = a.split('/').map(Number);
        const [bMonth, bDay, bYear] = b.split('/').map(Number);
        // For March dates in 2025
        const fullAYear = (aMonth <= 3) ? 2025 : 2024;
        const fullBYear = (bMonth <= 3) ? 2025 : 2024;
        const dateA = new Date(fullAYear, aMonth - 1, aDay);
        const dateB = new Date(fullBYear, bMonth - 1, bDay);
        return dateB - dateA;
      })[0];

    console.log('Last date calculation:', {
      availableDates: performanceData.map(entry => entry.Date).sort(),
      selectedLastDate: lastDate,
      parsedDate: (() => {
        const [month, day, year] = lastDate.split('/').map(Number);
        return new Date(month <= 3 ? 2025 : 2024, month - 1, day);
      })()
    });
    
    const lastDaySpend = performanceData
      .filter(entry => entry.Date === lastDate)
      .reduce((sum, entry) => sum + parseFloat(entry['Ad Spend'] || 0), 0);

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

    console.log('Processing financial resources:', creditCardData);

    creditCardData.forEach(account => {
      const accountName = account.account || '';
      const available = parseFloat(account.available?.toString().replace(/[$,]/g, '') || '0');
      const owing = parseFloat(account.owing?.toString().replace(/[$,]/g, '') || '0');
      const limit = parseFloat(account.limit?.toString().replace(/[$,]/g, '') || '0');

      console.log('Processing account:', {
        name: accountName,
        available,
        owing,
        limit,
        isCash: cashAccountNames.includes(accountName)
      });

      if (cashAccountNames.includes(accountName)) {
        cashInBank += available;
      } else {
        creditCardMetrics.totalAvailable += available;
        creditCardMetrics.totalOwing += owing;
        creditCardMetrics.totalLimit += limit;
      }
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

    console.log('Calculated metrics:', {
      cashInBank,
      creditCardMetrics,
      weeklyProjections,
      incomingPayments,
      upcomingExpensesByWeek
    });

    // Calculate total daily spend from last 7 days
    const totalDailySpend = mediaMetrics.reduce((sum, metric) => sum + metric.dailyAvgSpend, 0);
    
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
      currentDailySpend: totalDailySpend,
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
  }, [invoicesData, creditCardData, mediaMetrics, payrollData, performanceData]);

  // Calculate suggested budgets
  const suggestedBudgets = useMemo(() => {
    return mediaMetrics
      .filter(metric => metric.dailyAvgSpend > 0)
      .map(metric => {
        let suggestedDailyBudget = metric.dailyAvgSpend;
        
        // If ROI is good and we have room in our safe spending limit, suggest 20% increase
        if (metric.suggestedIncrease && 
            (financialMetrics.currentDailySpend * 1.2) < financialMetrics.safeSpendingLimit) {
          suggestedDailyBudget = Math.ceil(metric.dailyAvgSpend * 1.2 / 100) * 100; // Round up to nearest 100
        }

        return {
          ...metric,
          suggestedDailyBudget,
          change: suggestedDailyBudget - metric.dailyAvgSpend
        };
      })
      .sort((a, b) => b.roi - a.roi);
  }, [mediaMetrics, financialMetrics]);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Credit Line & Budget Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-sm text-gray-500">Cash in Bank</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(financialMetrics.cashInBank)}</div>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-sm text-gray-500">Credit Line Available</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(financialMetrics.creditCardMetrics.totalAvailable)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((financialMetrics.creditCardMetrics.totalAvailable / financialMetrics.creditCardMetrics.totalLimit) * 100).toFixed(1)}% of {formatCurrency(financialMetrics.creditCardMetrics.totalLimit)}
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-sm text-gray-500">30-Day Incoming Payments</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(financialMetrics.totalIncomingPayments)}</div>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-sm text-gray-500">30-Day Expenses</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financialMetrics.totalUpcomingExpenses)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-sm text-gray-500">Total Available Funds</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(financialMetrics.totalAvailableFunds)}</div>
            <div className="text-xs text-gray-500 mt-1">Cash + Credit Line</div>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-sm text-gray-500">Last Day's Ad Spend</div>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(financialMetrics.yesterdaySpend)}</div>
            <div className="text-xs text-gray-500 mt-1">Total spend for {financialMetrics.lastDate}</div>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-sm text-gray-500">Current Daily Ad Spend</div>
            <div className="text-2xl font-bold">{formatCurrency(financialMetrics.currentDailySpend)}</div>
            <div className="text-xs text-gray-500 mt-1">7-day average</div>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <div className="text-sm text-gray-500">Safe Daily Spending Limit</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialMetrics.safeSpendingLimit)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Based on 30-day projection</div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">30-Day Weekly Projections</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Week</th>
                  <th className="text-right p-4">Incoming Payments</th>
                  <th className="text-right p-4">Expenses</th>
                  <th className="text-right p-4">Net Cash Flow</th>
                  <th className="text-right p-4">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {financialMetrics.weeklyProjections.map((week) => (
                  <tr key={week.week} className="border-b">
                    <td className="p-4">Week {week.week}</td>
                    <td className="p-4 text-right text-green-600">{formatCurrency(week.incomingPayments)}</td>
                    <td className="p-4 text-right text-red-600">{formatCurrency(week.expenses)}</td>
                    <td className="p-4 text-right">
                      <span className={week.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(week.netCashFlow)}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatCurrency(week.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Media Buyer</th>
                <th className="text-left p-4">Offer</th>
                <th className="text-right p-4">Current Daily Avg</th>
                <th className="text-right p-4">ROI</th>
                <th className="text-right p-4">Suggested Daily Budget</th>
                <th className="text-right p-4">Change</th>
              </tr>
            </thead>
            <tbody>
              {suggestedBudgets.map((budget, index) => (
                <tr key={`${budget.buyer}-${budget.offer}-${index}`} className="border-b">
                  <td className="p-4">{budget.buyer}</td>
                  <td className="p-4">{budget.offer}</td>
                  <td className="p-4 text-right">{formatCurrency(budget.dailyAvgSpend)}</td>
                  <td className="p-4 text-right">
                    <span className={budget.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {budget.roi.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatCurrency(budget.suggestedDailyBudget)}
                  </td>
                  <td className="p-4 text-right">
                    {budget.change > 0 ? (
                      <div className="flex items-center justify-end text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {formatCurrency(budget.change)}
                      </div>
                    ) : budget.change < 0 ? (
                      <div className="flex items-center justify-end text-red-600">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        {formatCurrency(Math.abs(budget.change))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-end text-gray-400">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        No change
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Financial Health Check</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Monthly expenses buffer: {formatCurrency(MONTHLY_EXPENSES)} ({formatCurrency(DAILY_EXPENSE_BUFFER)}/day)<br />
                Net available for spending: {formatCurrency(financialMetrics.netAvailable)}<br />
                {financialMetrics.currentDailySpend > financialMetrics.safeSpendingLimit ? (
                  <span className="text-red-600 font-medium">
                    Warning: Current daily spend exceeds safe spending limit by {
                      formatCurrency(financialMetrics.currentDailySpend - financialMetrics.safeSpendingLimit)
                    }
                  </span>
                ) : (
                  <span className="text-green-600 font-medium">
                    Room for growth: {
                      formatCurrency(financialMetrics.safeSpendingLimit - financialMetrics.currentDailySpend)
                    } in daily spend available
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditLineManager; 