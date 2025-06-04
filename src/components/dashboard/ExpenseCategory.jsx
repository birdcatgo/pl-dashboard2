import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ExpenseCategory = ({ title, monthlyData, plData }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Calculate totals and trends
  const totalAmount = monthlyData.reduce((sum, month) => sum + (month.amount || 0), 0);
  const averageAmount = totalAmount / monthlyData.length;

  // Get the most recent two months for trend calculation
  const sortedMonths = [...monthlyData].sort((a, b) => {
    const monthOrder = { 'May': 5, 'April': 4, 'March': 3, 'February': 2, 'January': 1 };
    return monthOrder[b.month] - monthOrder[a.month];
  });

  console.log(`ExpenseCategory "${title}" sorted months:`, {
    sortedMonths: sortedMonths.map(d => ({ month: d.month, year: d.year, amount: d.amount })),
    monthOrder: { 'May': 5, 'April': 4, 'March': 3, 'February': 2, 'January': 1 }
  });

  const currentMonth = sortedMonths[0];
  const previousMonth = sortedMonths[1];

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const trend = calculateTrend(currentMonth?.amount || 0, previousMonth?.amount || 0);
  const trendColor = trend > 0 ? 'text-red-600' : 'text-green-600';
  const trendIcon = trend > 0 ? '↑' : '↓';

  const handleMonthClick = (month) => {
    setSelectedMonth(month);
    setShowDetails(true);
  };

  return (
    <div className="bg-white rounded-lg border p-4 mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">
            Average: {formatCurrency(averageAmount)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalAmount)}
          </div>
          {trend !== 0 && (
            <div className={`text-sm ${trendColor}`}>
              {trendIcon} {Math.abs(trend)}% vs last month
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
      >
        {showDetails ? (
          <>
            <ChevronDown className="h-4 w-4 mr-1" />
            Hide Details
          </>
        ) : (
          <>
            <ChevronRight className="h-4 w-4 mr-1" />
            Show Details
          </>
        )}
      </button>

      {showDetails && (
        <div className="mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.map((month, index) => (
                <tr 
                  key={index}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleMonthClick(month)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {month.month} {month.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(month.amount || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {month.revenue ? ((month.amount / month.revenue) * 100).toFixed(1) : '0.0'}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpenseCategory; 