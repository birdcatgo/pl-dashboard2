import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

const formatPercent = (value) => {
  if (!value || isNaN(value)) return '0%';
  // Convert to number and handle string values
  const numValue = typeof value === 'string' ? 
    parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  
  return `${Number(numValue).toFixed(1)}%`;
};

const parseAmount = (amount) => {
  if (!amount) return 0;
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    return parseFloat(amount.replace(/[$,]/g, '') || 0);
  }
  return 0;
};

const SummaryTable = ({ summaryData }) => {
  // Helper function to get the year for a month
  const getYearForMonth = (month) => {
    // January, February, March, and April are in 2025, all other months are in 2024
    return ['January', 'February', 'March', 'April'].includes(month) ? 2025 : 2024;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Summary</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          This view tracks actual money received and spent within each month, including all expenses (payroll, commissions, etc.). This differs from the Net Profit view which shows revenue earned from ad spend (regardless of when payment is received) minus ad spend for the month.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Profit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summaryData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {`${row.Month} ${getYearForMonth(row.Month)}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">{formatCurrency(row.Income)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">{formatCurrency(row.Expenses)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{formatCurrency(row.NetProfit)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatPercent(row['Net%'])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const MonthlyDetails = ({ monthData, month }) => {
  const [expandedCategory, setExpandedCategory] = React.useState(null);

  if (!monthData) return null;

  const { incomeData, categories, totalIncome, totalExpenses } = monthData;
  const year = ['January', 'February'].includes(month) ? 2025 : 2024;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Income Section */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Income - {month} {year}</CardTitle>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {incomeData.map((item, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center p-3 bg-white hover:bg-gray-50 rounded-lg border"
              >
                <span className="font-medium">{item.DESCRIPTION}</span>
                <span className="text-green-600 font-medium">
                  {formatCurrency(item.AMOUNT)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Expenses - {month} {year}</CardTitle>
            <span className="text-xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {Object.entries(categories).map(([category, items]) => {
              const categoryTotal = items.reduce((sum, item) => 
                sum + parseAmount(item.AMOUNT), 0
              );
              
              return (
                <div key={category} className="border rounded-lg shadow-sm">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-50 rounded-t-lg"
                  >
                    <div className="flex items-center space-x-2">
                      {expandedCategory === category ? 
                        <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      }
                      <span className="font-medium text-gray-900">{category}</span>
                    </div>
                    <span className="text-red-600 font-medium">
                      {formatCurrency(categoryTotal)}
                    </span>
                  </button>
                  {expandedCategory === category && (
                    <div className="border-t p-4 bg-gray-50">
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div 
                            key={index} 
                            className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm"
                          >
                            <span className="text-gray-600">{item.DESCRIPTION}</span>
                            <span className="text-red-600">
                              {formatCurrency(item.AMOUNT)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ExpenseCategoriesTrend = ({ monthlyData }) => {
  const getYearForMonth = (month) => {
    // January, February, March, and April are in 2025, all other months are in 2024
    return ['January', 'February', 'March', 'April'].includes(month) ? 2025 : 2024;
  };

  // Define category groupings
  const categoryGroups = {
    'Advertising': ['Advertising', 'Ad Spend', 'Marketing'],
    'Payroll': ['Payroll', 'Salary', 'Commissions', 'Contractors', 'Bonuses'],
    'General Expenses': ['Software', 'Subscriptions', 'Tools', 'Training', 'Travel', 'Office', 'Utilities', 'Bank Fees', 'Legal', 'Accounting', 'Insurance', 'Memberships']
  };

  // Helper function to determine which group a category belongs to
  const getCategoryGroup = (category) => {
    const normalizedCategory = category.toLowerCase();
    for (const [group, categories] of Object.entries(categoryGroups)) {
      if (categories.some(c => normalizedCategory.includes(c.toLowerCase()))) {
        return group;
      }
    }
    return 'General Expenses'; // Default group for uncategorized items
  };

  // Get all unique categories across all months
  const allCategories = Object.values(monthlyData).reduce((categories, monthData) => {
    Object.keys(monthData.categories || {}).forEach(category => {
      if (!categories.includes(category)) {
        categories.push(category);
      }
    });
    return categories;
  }, []).sort();

  // Get all months in chronological order and take only the most recent 6
  const monthOrder = ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February'];
  const months = Object.keys(monthlyData)
    .sort((a, b) => monthOrder.indexOf(b) - monthOrder.indexOf(a))
    .slice(0, 6)
    .reverse();

  // Calculate totals for each category by month and group them
  const groupedCategories = allCategories.reduce((groups, category) => {
    const group = getCategoryGroup(category);
    if (!groups[group]) {
      groups[group] = [];
    }

    const monthlyTotals = months.map(month => {
      const categoryItems = monthlyData[month]?.categories[category] || [];
      return categoryItems.reduce((sum, item) => sum + parseAmount(item.AMOUNT), 0);
    });

    groups[group].push({
      category,
      totals: monthlyTotals,
      average: monthlyTotals.reduce((sum, total) => sum + total, 0) / monthlyTotals.length
    });

    return groups;
  }, {});

  // Calculate group totals
  const groupTotals = Object.entries(groupedCategories).reduce((totals, [group, categories]) => {
    totals[group] = months.map((_, monthIndex) => {
      return categories.reduce((sum, category) => sum + category.totals[monthIndex], 0);
    });
    return totals;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Categories Trend (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Category</th>
                {months.map(month => (
                  <th key={month} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                    {month} {getYearForMonth(month)}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 w-36">
                  Average
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(groupedCategories).map(([group, categories]) => (
                <React.Fragment key={group}>
                  {/* Group Header */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-6 py-3 text-left text-sm text-gray-900">
                      {group}
                    </td>
                    {groupTotals[group].map((total, index) => (
                      <td key={index} className="px-6 py-3 text-right text-sm text-gray-900">
                        {formatCurrency(total)}
                      </td>
                    ))}
                    <td className="px-6 py-3 text-right text-sm bg-gray-200">
                      {formatCurrency(groupTotals[group].reduce((sum, total) => sum + total, 0) / months.length)}
                    </td>
                  </tr>
                  {/* Category Rows */}
                  {categories.map(({ category, totals, average }) => (
                    <tr key={category} className="hover:bg-gray-50">
                      <td className="pl-10 py-2 whitespace-nowrap text-sm text-gray-600">
                        {category}
                      </td>
                      {totals.map((total, index) => (
                        <td key={index} className="px-6 py-2 whitespace-nowrap text-sm text-right text-gray-600">
                          {formatCurrency(total)}
                        </td>
                      ))}
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-right text-gray-600 bg-gray-50">
                        {formatCurrency(average)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {/* Grand Total Row */}
              <tr className="bg-gray-900 text-white font-semibold">
                <td className="px-6 py-3 whitespace-nowrap text-sm">
                  Total Expenses
                </td>
                {months.map(month => {
                  const monthTotal = monthlyData[month]?.totalExpenses || 0;
                  return (
                    <td key={month} className="px-6 py-3 whitespace-nowrap text-sm text-right">
                      {formatCurrency(monthTotal)}
                    </td>
                  );
                })}
                <td className="px-6 py-3 whitespace-nowrap text-sm text-right bg-gray-800">
                  {formatCurrency(
                    months.reduce((sum, month) => sum + (monthlyData[month]?.totalExpenses || 0), 0) / months.length
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const PLWrapper = ({ plData, monthlyData, selectedMonth, onMonthChange }) => {
  // Define month weights for proper chronological ordering
  const getMonthWeight = (month) => {
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthOrder.indexOf(month);
    // For 2025 months (January, February, March, and April), add 12 to their index
    const yearOffset = ['January', 'February', 'March', 'April'].includes(month) ? 12 : 0;
    return monthIndex + yearOffset;
  };

  // Get the latest month from the available months
  const latestMonth = Object.keys(monthlyData).sort((a, b) => {
    return getMonthWeight(b) - getMonthWeight(a);
  })[0];

  // Set the initial selected month to the latest month if none is selected
  React.useEffect(() => {
    if (!selectedMonth && latestMonth) {
      onMonthChange(latestMonth);
    }
  }, [selectedMonth, latestMonth, onMonthChange]);

  return (
    <div className="space-y-6">
      {/* Summary Table */}
      <SummaryTable summaryData={plData?.summary || []} />

      {/* Month Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Monthly Details</h2>
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="w-48 bg-white border border-gray-300 shadow-sm">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-md">
              {Object.keys(monthlyData)
                .sort((a, b) => getMonthWeight(b) - getMonthWeight(a))
                .map(month => {
                  const year = ['January', 'February', 'March', 'April'].includes(month) ? '2025' : '2024';
                  return (
                    <SelectItem 
                      key={month} 
                      value={month}
                      className="hover:bg-blue-50 bg-white"
                    >
                      {month} {year}
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Monthly Details */}
      {selectedMonth && monthlyData[selectedMonth] && (
        <MonthlyDetails 
          monthData={monthlyData[selectedMonth]}
          month={selectedMonth}
        />
      )}

      {/* Expense Categories Trend */}
      <ExpenseCategoriesTrend monthlyData={monthlyData} />
    </div>
  );
};

export default PLWrapper;