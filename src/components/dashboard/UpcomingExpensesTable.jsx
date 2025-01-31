import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const UpcomingExpensesTable = ({ data = [] }) => {
  console.log('Raw Expenses Data:', data); // Debug log

  // Ensure data is an array and has content
  const expenses = Array.isArray(data) ? data : [];

  // Calculate metrics
  const metrics = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const amount = parseFloat(expense.Amount || 0);
      if (expense.Type === 'payroll') {
        acc.totalPayroll += amount;
        acc.payrollCount++;
      } else if (expense.Type === 'credit') {
        acc.totalCredit += amount;
        acc.creditCount++;
      }
      acc.totalAmount += amount;
      return acc;
    }, { 
      totalPayroll: 0, 
      totalCredit: 0, 
      totalAmount: 0,
      payrollCount: 0,
      creditCount: 0 
    });
  }, [expenses]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Sort expenses by due date (most recent first)
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const dateA = new Date(a.DueDate);
      const dateB = new Date(b.DueDate);
      return dateA - dateB;
    });
  }, [expenses]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!expenses.length) {
    return (
      <div className="text-center p-6 text-gray-500">
        No upcoming expenses found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="text-sm text-red-600 font-medium">Total Payroll</div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(metrics.totalPayroll)}
            </div>
            <div className="text-sm text-red-600 mt-1">
              {metrics.payrollCount} upcoming payments
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-600 font-medium">Credit Card Payments</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(metrics.totalCredit)}
            </div>
            <div className="text-sm text-blue-600 mt-1">
              {metrics.creditCount} upcoming payments
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="pt-6">
            <div className="text-sm text-purple-600 font-medium">Total Expenses</div>
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(metrics.totalAmount)}
            </div>
            <div className="text-sm text-purple-600 mt-1">
              {expenses.length} total expenses
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedExpenses.map((expense, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        expense.Type === 'payroll' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {expense.Type === 'payroll' ? 'Payroll' : 'Credit Card'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.Description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(expense.DueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(expense.Amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingExpensesTable;