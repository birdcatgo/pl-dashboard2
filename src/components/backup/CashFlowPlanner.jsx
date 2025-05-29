import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, CreditCard, Calendar } from 'lucide-react';
import { format, addDays, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subDays } from 'date-fns';

const CashFlowPlanner = ({ performanceData, creditCardData, upcomingExpenses, invoicesData, networkExposureData }) => {
  const [dailySpend, setDailySpend] = useState(0);

  // Calculate credit card utilization
  const creditCardMetrics = useMemo(() => {
    if (!Array.isArray(creditCardData)) {
      console.log('Invalid credit card data format');
      return { totalLimit: 0, totalUsed: 0, availableCredit: 0 };
    }

    return creditCardData.reduce((acc, card) => {
      const limit = parseFloat(card.limit || 0);
      const used = parseFloat(card.owing || 0);
      return {
        totalLimit: acc.totalLimit + limit,
        totalUsed: acc.totalUsed + used,
        availableCredit: acc.availableCredit + (limit - used)
      };
    }, { totalLimit: 0, totalUsed: 0, availableCredit: 0 });
  }, [creditCardData]);

  // Calculate upcoming expenses
  const upcomingExpensesMetrics = useMemo(() => {
    if (!Array.isArray(upcomingExpenses)) {
      console.log('Invalid upcoming expenses format');
      return { total: 0, byCategory: {} };
    }

    const thirtyDaysFromNow = addDays(new Date(), 30);
    
    return upcomingExpenses.reduce((acc, expense) => {
      if (!expense || !expense.dueDate) return acc;
      
      const dueDate = new Date(expense.dueDate);
      if (dueDate <= thirtyDaysFromNow) {
        const amount = parseFloat(expense.amount || 0);
        const category = expense.status || 'Uncategorized';
        
        acc.total += amount;
        acc.byCategory[category] = (acc.byCategory[category] || 0) + amount;
      }
      return acc;
    }, { total: 0, byCategory: {} });
  }, [upcomingExpenses]);

  // Calculate incoming money from invoices
  const incomingMoney = useMemo(() => {
    if (!Array.isArray(invoicesData)) {
      console.log('Invalid invoice data format');
      return { total: 0, byWeek: {} };
    }

    const thirtyDaysFromNow = addDays(new Date(), 30);
    
    return invoicesData.reduce((acc, invoice) => {
      if (!invoice || !invoice.DueDate) return acc;
      
      const dueDate = new Date(invoice.DueDate);
      if (dueDate <= thirtyDaysFromNow) {
        const amount = parseFloat(invoice.AmountDue?.replace(/[^0-9.-]+/g, '') || 0);
        const weekNumber = Math.floor((dueDate - new Date()) / (7 * 24 * 60 * 60 * 1000));
        
        acc.total += amount;
        acc.byWeek[weekNumber] = (acc.byWeek[weekNumber] || 0) + amount;
      }
      return acc;
    }, { total: 0, byWeek: {} });
  }, [invoicesData]);

  // Calculate spending distribution based on net terms
  const spendingDistribution = useMemo(() => {
    if (!Array.isArray(networkExposureData)) {
      console.log('No network exposure data available');
      return { weekly: 0, monthly: 0, biMonthly: 0 };
    }

    const distribution = { weekly: 0, monthly: 0, biMonthly: 0 };
    
    networkExposureData.forEach(network => {
      if (!network) return;
      
      const spend = parseFloat(network.runningTotal || 0);
      const netTerms = parseInt(network.netTerms || 0);
      
      if (netTerms <= 7) {
        distribution.weekly += spend;
      } else if (netTerms <= 30) {
        distribution.monthly += spend;
      } else {
        distribution.biMonthly += spend;
      }
    });

    return distribution;
  }, [networkExposureData]);

  // Calculate required float
  const requiredFloat = useMemo(() => {
    const { weekly, monthly, biMonthly } = spendingDistribution;
    return weekly + (monthly / 2) + (biMonthly / 4);
  }, [spendingDistribution]);

  // Calculate safe daily spending limit
  const safeSpendingLimit = useMemo(() => {
    const totalAvailable = creditCardMetrics.availableCredit + incomingMoney.total;
    const totalRequired = requiredFloat + upcomingExpensesMetrics.total;
    const safetyBuffer = totalRequired * 0.2; // 20% safety buffer
    return Math.max(0, (totalAvailable - totalRequired - safetyBuffer) / 30);
  }, [creditCardMetrics, incomingMoney, requiredFloat, upcomingExpensesMetrics]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Planner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Credit Card Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div className="text-sm text-blue-600 font-medium">Total Credit Limit</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(creditCardMetrics.totalLimit)}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    {formatCurrency(creditCardMetrics.availableCredit)} available
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div className="text-sm text-green-600 font-medium">Incoming Money (30 days)</div>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(incomingMoney.total)}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Across {Object.keys(incomingMoney.byWeek).length} weeks
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div className="text-sm text-purple-600 font-medium">Upcoming Expenses (30 days)</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    {formatCurrency(upcomingExpensesMetrics.total)}
                  </div>
                  <div className="text-sm text-purple-600 mt-1">
                    {Object.keys(upcomingExpensesMetrics.byCategory).length} categories
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Spending Distribution */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Spending Distribution by Terms</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Weekly Terms</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(spendingDistribution.weekly)}
                    </div>
                    <div className="text-sm text-gray-500">per day</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Monthly Terms</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(spendingDistribution.monthly)}
                    </div>
                    <div className="text-sm text-gray-500">per day</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Bi-Monthly Terms</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(spendingDistribution.biMonthly)}
                    </div>
                    <div className="text-sm text-gray-500">per day</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Safe Spending Limit */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Safe Spending Limit</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600">Daily Safe Spending Limit</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(safeSpendingLimit)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Based on available credit, incoming money, and required float
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowPlanner;