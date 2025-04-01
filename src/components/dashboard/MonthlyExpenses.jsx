import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import _ from 'lodash';

const formatCurrency = (value) => {
  if (!value) return '$0';
  const numValue = typeof value === 'string' ? 
    parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
};

const parseAmount = (amount) => {
  if (!amount) return 0;
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    return parseFloat(amount.replace(/[$,]/g, '') || 0);
  }
  return 0;
};

const MonthlyExpenses = ({ monthlyData }) => {
  // Get the most recent month's data
  const currentMonth = React.useMemo(() => {
    if (!monthlyData) return null;
    
    const months = Object.keys(monthlyData);
    if (months.length === 0) return null;
    
    // Sort months to get the most recent one
    const monthOrder = ['March', 'February', 'January', 'December', 'November', 'October', 'September', 'August', 'July', 'June'];
    const sortedMonths = months.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    
    return monthlyData[sortedMonths[0]];
  }, [monthlyData]);

  // Debug logging
  React.useEffect(() => {
    console.log('MonthlyExpenses received data:', {
      hasData: !!monthlyData,
      months: monthlyData ? Object.keys(monthlyData) : [],
      currentMonthData: currentMonth
    });
  }, [monthlyData, currentMonth]);

  // Group expenses by category and sort by amount
  const groupedExpenses = React.useMemo(() => {
    if (!currentMonth?.categories) {
      console.log('No expenses data available');
      return [];
    }

    return _.chain(Object.entries(currentMonth.categories))
      .map(([category, expenses]) => ({
        category,
        expenses: expenses.map(expense => ({
          ...expense,
          Amount: parseAmount(expense.AMOUNT)
        })).sort((a, b) => b.Amount - a.Amount), // Sort expenses within category by amount
        total: _.sumBy(expenses, expense => parseAmount(expense.AMOUNT))
      }))
      .orderBy(['total'], ['desc']) // Sort categories by total amount
      .value();
  }, [currentMonth]);

  // Calculate total expenses
  const totalExpenses = React.useMemo(() => {
    return currentMonth?.totalExpenses || 0;
  }, [currentMonth]);

  if (!currentMonth?.categories || Object.keys(currentMonth.categories).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No expense data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Monthly Expenses</CardTitle>
        <span className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedExpenses.map(({ category, expenses, total }) => (
                <React.Fragment key={category}>
                  {/* Category Header */}
                  <tr className="bg-gray-50">
                    <td colSpan="2" className="px-6 py-3 text-sm font-medium text-gray-900">
                      {category}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-medium text-red-600">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                  {/* Expense Items */}
                  {expenses.map((expense, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.DESCRIPTION || 'No Description'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(expense.Amount)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyExpenses; 