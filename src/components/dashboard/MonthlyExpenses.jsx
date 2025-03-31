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
  // Debug logging
  React.useEffect(() => {
    console.log('MonthlyExpenses received data:', {
      hasData: !!expensesData,
      dataLength: expensesData?.length,
      sampleData: expensesData?.[0],
      categories: expensesData ? _.uniq(expensesData.map(e => e.Category)) : []
    });
  }, [expensesData]);

  // Group expenses by category
  const groupedExpenses = React.useMemo(() => {
    if (!expensesData?.length) {
      console.log('No expenses data available');
      return [];
    }

    const grouped = _.chain(expensesData)
      .groupBy('Category')
      .map((expenses, category) => ({
        category,
        expenses,
        total: _.sumBy(expenses, 'Amount')
      }))
      .orderBy(['total'], ['desc'])
      .value();

    console.log('Grouped expenses:', {
      groupCount: grouped.length,
      categories: grouped.map(g => g.category),
      totalAmount: _.sumBy(grouped, 'total')
    });

    return grouped;
  }, [expensesData]);

  // Calculate total expenses
  const totalExpenses = React.useMemo(() => {
    return _.sumBy(expensesData, 'Amount');
  }, [expensesData]);

  if (!expensesData?.length) {
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
      <CardHeader>
        <CardTitle>Monthly Expenses</CardTitle>
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
              {groupedExpenses.map(({ category, expenses }) => (
                <React.Fragment key={category}>
                  {/* Category Header */}
                  <tr className="bg-gray-50">
                    <td colSpan="2" className="px-6 py-3 text-sm font-medium text-gray-900">
                      {category}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(_.sumBy(expenses, 'Amount'))}
                    </td>
                  </tr>
                  {/* Expense Items */}
                  {expenses.map((expense, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.Description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(expense.Amount)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-gray-900 text-white">
              <tr>
                <td colSpan="2" className="px-6 py-4 text-sm font-medium">
                  Total Expenses
                </td>
                <td className="px-6 py-4 text-sm text-right font-medium">
                  {formatCurrency(totalExpenses)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyExpenses; 