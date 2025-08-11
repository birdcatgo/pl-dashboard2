import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, DollarSign, Receipt } from 'lucide-react';
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
  // Helper function to extract year from month name (e.g., "June 2025" -> "2025")
  const getYearForMonth = (month) => {
    // If month already includes year, extract it
    if (month.includes('2025')) return '2025';
    if (month.includes('2024')) return '2024';
    
    // Fallback for old format without years
    return ['January', 'February', 'March', 'April', 'May', 'June'].includes(month) ? '2025' : '2024';
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
                    {row.Month.includes('2025') || row.Month.includes('2024') ? row.Month : `${row.Month} ${getYearForMonth(row.Month)}`}
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
  const [expandedCategories, setExpandedCategories] = React.useState({});
  const [expandedIncome, setExpandedIncome] = React.useState(false);
  

  
  // Process income and expenses using the correct data structure from pl-processor.js
  // Use income/expenses arrays directly if incomeData/expenseData are empty
  const incomeData = monthData?.incomeData?.length > 0 ? monthData.incomeData : (monthData?.income || []);
  const expenseData = monthData?.expenseData?.length > 0 ? monthData.expenseData : (monthData?.expenses || []);
  const categories = monthData?.categories || {};
  


  // Calculate totals
  const totalIncome = monthData?.totalIncome || 0;
  const totalExpenses = monthData?.totalExpenses || 0;
  const netProfit = totalIncome - totalExpenses;

  // Sort categories by total amount and filter out zero categories
  const sortedCategories = Object.entries(categories)
    .map(([category, items]) => {
      const total = items.reduce((sum, item) => {
        const amount = parseFloat(item.Amount) || 0;
        return sum + Math.abs(amount);
      }, 0);
      return { category, total, items };
    })
    .filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleIncome = () => {
    setExpandedIncome(prev => !prev);
  };

  return (
    <div className="space-y-4">
      {/* Income and Expenses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-semibold text-gray-900">Income</h3>
            </div>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              {/* Income Summary - Always Visible */}
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">Total Income</span>
                <span className="text-sm font-medium text-green-600 tabular-nums">
                  {formatCurrency(Math.abs(totalIncome))}
                </span>
              </div>
              
              {/* Expandable Income Details */}
              {incomeData.length > 0 && (
                <div className="border border-gray-100 rounded-md overflow-hidden">
                  <button
                    onClick={toggleIncome}
                    className="w-full flex justify-between items-center p-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight 
                        className={`w-3 h-3 text-gray-400 transition-transform ${
                          expandedIncome ? 'transform rotate-90' : ''
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900">Income Details</span>
                    </div>
                    <span className="text-sm text-gray-500">({incomeData.length} items)</span>
                  </button>
                  {expandedIncome && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      <div className="p-2 space-y-1">
                        {incomeData.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-0.5">
                            <span className="text-sm text-gray-600">{item.Description}</span>
                            <span className="text-sm font-medium text-green-600 tabular-nums">
                              {formatCurrency(Math.abs(parseFloat(item.Amount) || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-gray-900">Expenses</h3>
            </div>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              {/* Expenses Summary - Always Visible */}
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">Total Expenses</span>
                <span className="text-sm font-medium text-red-600 tabular-nums">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
              
              {/* Expandable Expense Categories */}
              {sortedCategories.map(({ category, total, items }) => (
                <div key={category} className="border border-gray-100 rounded-md overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex justify-between items-center p-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight 
                        className={`w-3 h-3 text-gray-400 transition-transform ${
                          expandedCategories[category] ? 'transform rotate-90' : ''
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900">{category}</span>
                    </div>
                    <span className="text-sm font-medium text-red-600 tabular-nums">
                      {formatCurrency(total)}
                    </span>
                  </button>
                  {expandedCategories[category] && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      <div className="p-2 space-y-1">
                        {items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-0.5">
                            <span className="text-sm text-gray-600">{item.Description}</span>
                            <span className="text-sm font-medium text-red-600 tabular-nums">
                              {formatCurrency(Math.abs(parseFloat(item.Amount) || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Net Profit Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Net Profit</span>
          <span className={`text-lg font-bold tabular-nums ${
            netProfit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(netProfit)}
          </span>
        </div>
      </div>
    </div>
  );
};

const ExpenseCategoriesTrend = ({ monthlyData }) => {
  const getLastSixMonths = () => {
    // Get all available months from the data
    const availableMonths = Object.keys(monthlyData).sort((a, b) => {
      // Sort by year and month
      const aYear = a.includes('2025') ? 2025 : 2024;
      const bYear = b.includes('2025') ? 2025 : 2024;
      if (aYear !== bYear) return bYear - aYear;
      
      const monthOrder = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
        'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
      };
      
      const aMonth = a.split(' ')[0];
      const bMonth = b.split(' ')[0];
      return monthOrder[bMonth] - monthOrder[aMonth];
    });
    
    // Return the last 6 months
    return availableMonths.slice(0, 6).map(month => ({
      month: month,
      year: month.includes('2025') ? '2025' : '2024'
    }));
  };

  const monthOrder = getLastSixMonths();

  // Get all unique categories from the last 6 months
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set();
    monthOrder.forEach(({ month }) => {
      const monthData = monthlyData[month];
      if (monthData?.categories) {
        Object.keys(monthData.categories).forEach(category => {
          uniqueCategories.add(category);
        });
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [monthlyData, monthOrder]);

  // Calculate totals for each category by month
  const categoryTotals = React.useMemo(() => {
    const totals = {};
    categories.forEach(category => {
      totals[category] = monthOrder.map(({ month }) => {
        const monthData = monthlyData[month];
        if (!monthData?.categories?.[category]) return 0;
        
        return monthData.categories[category].reduce((sum, item) => {
          const amount = parseFloat(item.Amount) || 0;
          return sum + Math.abs(amount);
        }, 0);
      });
    });
    return totals;
  }, [categories, monthlyData, monthOrder]);

  // Calculate averages for each category
  const categoryAverages = React.useMemo(() => {
    const averages = {};
    categories.forEach(category => {
      const totals = categoryTotals[category];
      const validTotals = totals.filter(total => total > 0);
      averages[category] = validTotals.length > 0
        ? validTotals.reduce((sum, total) => sum + total, 0) / validTotals.length
        : 0;
    });
    return averages;
  }, [categories, categoryTotals]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          Expense Categories Trend (Last 6 Months)
        </h3>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                {monthOrder.map(({ month, year }) => (
                  <th key={`${month}-${year}`} className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {month.split(' ')[0].slice(0, 3)} {year.slice(2)}
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category, index) => (
                <tr key={category} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                    {category}
                  </td>
                  {monthOrder.map(({ month }, index) => (
                    <td key={`${month}-${index}`} className="px-3 py-2 whitespace-nowrap text-right text-gray-500 tabular-nums">
                      {formatCurrency(categoryTotals[category][index])}
                    </td>
                  ))}
                  <td className="px-3 py-2 whitespace-nowrap text-right font-medium text-gray-900 tabular-nums">
                    {formatCurrency(categoryAverages[category])}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                  Total
                </td>
                {monthOrder.map(({ month }, index) => {
                  const monthTotal = categories.reduce((sum, category) => 
                    sum + categoryTotals[category][index], 0
                  );
                  return (
                    <td key={`${month}-${index}`} className="px-3 py-2 whitespace-nowrap text-right font-medium text-gray-900 tabular-nums">
                      {formatCurrency(monthTotal)}
                    </td>
                  );
                })}
                <td className="px-3 py-2 whitespace-nowrap text-right font-medium text-gray-900 tabular-nums">
                  {formatCurrency(Object.values(categoryAverages).reduce((sum, avg) => sum + avg, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PLWrapper = ({ plData, monthlyData, selectedMonth, onMonthChange, selectedMonthData }) => {
  const getMonthWeight = (month) => {
    const weights = {
      'July 2025': 2025 * 12 + 7,      // July 2025
      'June 2025': 2025 * 12 + 6,      // June 2025
      'May 2025': 2025 * 12 + 5,      // May 2025
      'April 2025': 2025 * 12 + 4,    // April 2025
      'March 2025': 2025 * 12 + 3,    // March 2025
      'February 2025': 2025 * 12 + 2, // February 2025
      'January 2025': 2025 * 12 + 1,  // January 2025
      'December 2024': 2024 * 12 + 12, // December 2024
      'November 2024': 2024 * 12 + 11, // November 2024
      'October 2024': 2024 * 12 + 10,  // October 2024
      'September 2024': 2024 * 12 + 9, // September 2024
      'August 2024': 2024 * 12 + 8,    // August 2024
      'July 2024': 2024 * 12 + 7,      // July 2024
      'June 2024': 2024 * 12 + 6        // June 2024
    };
    return weights[month] || 0;
  };

  // Get all available months and sort them
  const availableMonths = Object.keys(plData?.monthly || {})
    .sort((a, b) => getMonthWeight(b) - getMonthWeight(a));

  // If no month is selected and we have available months, select the first one
  React.useEffect(() => {
    if (!selectedMonth && availableMonths.length > 0) {
      onMonthChange(availableMonths[0]);
    }
  }, [selectedMonth, availableMonths, onMonthChange]);

  return (
    <div className="space-y-6">
      {/* Header and Month Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Cash View (Money In/Out)</h2>
        <div className="flex items-center gap-4">
          <Select value={selectedMonth || ''} onValueChange={onMonthChange}>
            <SelectTrigger className="w-[200px] bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
              <SelectValue placeholder="Select a month" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              {availableMonths.map(month => (
                <SelectItem 
                  key={month} 
                  value={month}
                  className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                >
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Show message if no month is selected */}
      {!selectedMonth && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Please select a month to view the Cash View (Money In/Out) details.</p>
        </div>
      )}

      {/* Monthly Details */}
      {selectedMonthData && selectedMonth && (
        <MonthlyDetails 
          monthData={selectedMonthData}
          month={selectedMonth}
        />
      )}

      {/* Summary Table */}
      {plData?.summary && plData.summary.length > 0 && (
        <SummaryTable summaryData={plData.summary} />
      )}

      {/* Expense Categories Trend */}
      {plData?.monthly && Object.keys(plData.monthly).length > 0 && (
        <ExpenseCategoriesTrend monthlyData={plData.monthly} />
      )}
    </div>
  );
};

export default PLWrapper;