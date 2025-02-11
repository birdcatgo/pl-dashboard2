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

const ExpenseCategory = ({ title, monthlyData, monthlyExpenses, plData }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const isAdvertising = title === "Advertising Spend";

  const totalAmount = monthlyData.reduce((sum, month) => sum + month.amount, 0);
  const averageAmount = totalAmount / monthlyData.length;

  const handleMonthClick = (month) => {
    setSelectedMonth(month);
    setShowDetails(true);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-500 hover:text-gray-700"
        >
          {showDetails ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total {title}</p>
          <p className="text-xl font-semibold">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Monthly Average</p>
          <p className="text-xl font-semibold">{formatCurrency(averageAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Trend</p>
          <p className="text-xl font-semibold">
            {monthlyData.length >= 2 
              ? ((monthlyData[monthlyData.length - 1].amount - monthlyData[monthlyData.length - 2].amount) 
                / monthlyData[monthlyData.length - 2].amount * 100).toFixed(1) + '%'
              : 'N/A'}
          </p>
        </div>
      </div>

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
                    {month.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(month.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {((month.amount / monthlyData[index].revenue) * 100).toFixed(1)}%
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