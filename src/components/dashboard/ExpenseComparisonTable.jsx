import React, { useState } from 'react';
import { format } from 'date-fns';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ExpenseComparisonTable = ({ monthlyData, plData }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Add helper function for name normalization
  const normalizeExpenseName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      // Remove common separators and special characters
      .replace(/[.,\-_&\/\\|]+/g, ' ')
      // Remove common suffixes
      .replace(/\.(com|io|ai|net|org)$/g, '')
      // Remove common words
      .replace(/\b(inc|llc|ltd|subscription|license|platform)\b/g, '')
      // Remove extra spaces
      .trim()
      .replace(/\s+/g, ' ');
  };

  // Add helper function for finding similar names
  const findSimilarExpense = (expenses, name) => {
    const normalizedName = normalizeExpenseName(name);
    return expenses.find(expense => {
      const normalizedExpense = normalizeExpenseName(expense.CATEGORY);
      return normalizedExpense === normalizedName;
    });
  };

  // Process the data for comparison
  const processedData = monthlyData.map(month => {
    const monthName = format(month.month, 'MMMM');
    const expenses = plData.monthly[monthName]?.expenseData || [];
    
    return {
      month: monthName,
      expenses: expenses.map(expense => ({
        ...expense,
        normalizedName: normalizeExpenseName(expense.CATEGORY)
      }))
    };
  });

  // Find expenses that appear in multiple months
  const commonExpenses = processedData.reduce((acc, month) => {
    month.expenses.forEach(expense => {
      if (!acc[expense.normalizedName]) {
        acc[expense.normalizedName] = {
          name: expense.CATEGORY,
          months: {},
          total: 0
        };
      }
      acc[expense.normalizedName].months[month.month] = expense.AMOUNT;
      acc[expense.normalizedName].total += parseFloat(expense.AMOUNT);
    });
    return acc;
  }, {});

  // Sort expenses by total amount
  const sortedExpenses = Object.entries(commonExpenses)
    .sort(([, a], [, b]) => b.total - a.total);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Comparison</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expense
              </th>
              {processedData.map(month => (
                <th key={month.month} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {month.month}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedExpenses.map(([key, expense]) => (
              <tr key={key} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {expense.name}
                </td>
                {processedData.map(month => (
                  <td key={month.month} className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {expense.months[month.month] ? formatCurrency(expense.months[month.month]) : '-'}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  {formatCurrency(expense.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseComparisonTable; 