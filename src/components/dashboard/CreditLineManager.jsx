import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

    creditCardData.forEach(account => {
      const accountName = account.account || '';
      const available = parseFloat(account.available?.toString().replace(/[$,]/g, '') || '0');
      const owing = parseFloat(account.owing?.toString().replace(/[$,]/g, '') || '0');
      const limit = parseFloat(account.limit?.toString().replace(/[$,]/g, '') || '0');

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
  }, [invoicesData, creditCardData, payrollData, performanceData]);

  return (
    <Card>
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
            <div className="text-sm text-gray-500">Safe Daily Spending Limit</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialMetrics.safeSpendingLimit)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Based on 30-day projection</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditLineManager; 