import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import _ from 'lodash';

const formatCurrency = (value) => {
  if (!value) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const MonthlyExpenses = ({ expensesData }) => {
  // Transform array data into objects with named properties
  const processedExpenses = React.useMemo(() => {
    if (!expensesData?.length) return [];
    
    return expensesData.map(row => ({
      Category: row[0],
      Description: row[1],
      Amount: parseFloat((row[2] || '0').replace(/[$,]/g, '')),
      Date: row[3]
    }));
  }, [expensesData]);

  // Sort expenses by date (soonest to latest)
  const sortedExpenses = React.useMemo(() => {
    if (!processedExpenses?.length) return [];
    
    return _.orderBy(processedExpenses, ['Date'], ['asc']);
  }, [processedExpenses]);

  if (!processedExpenses?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Expenses</CardTitle>
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
      <CardHeader>
        <CardTitle>Upcoming Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedExpenses.map((expense, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.Category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.Description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.Date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {formatCurrency(expense.Amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyExpenses; 