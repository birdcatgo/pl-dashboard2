import React, { useState } from 'react';
import { TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const MediaBuyerSpend = ({ onSpendChange, cashManagementData }) => {
  const defaultBuyers = [
    { name: 'Zel', averageSpend: 2000 },
    { name: 'Daniel', averageSpend: 15000 },
    { name: 'Mike', averageSpend: 10000 },
    { name: 'Dave', averageSpend: 2000 },
    { name: 'Asheesh', averageSpend: 10000 }
  ];

  const [spendAmounts, setSpendAmounts] = useState(() =>
    defaultBuyers.reduce((acc, buyer) => ({
      ...acc,
      [buyer.name]: buyer.averageSpend
    }), {})
  );

  // Calculate totals
  const totalCash = parseFloat(cashManagementData?.currentBalance || 0);
  const totalCredit = parseFloat(cashManagementData?.creditAvailable || 0);
  const totalAvailableFunds = totalCash + totalCredit;

  // Calculate spends
  const totalAverageSpend = defaultBuyers.reduce((sum, buyer) => sum + buyer.averageSpend, 0);
  const totalDailySpend = Object.values(spendAmounts).reduce((sum, spend) => sum + (parseFloat(spend) || 0), 0);
  
  // Calculate days of coverage
  const averageDaysOfCoverage = totalAverageSpend > 0 ? Math.floor(totalAvailableFunds / totalAverageSpend) : 0;
  const scenarioDaysOfCoverage = totalDailySpend > 0 ? Math.floor(totalAvailableFunds / totalDailySpend) : 0;

  const handleSpendChange = (buyerName, value) => {
    const numericValue = parseFloat(value.replace(/[^\d.]/g, '')) || 0;
    const newSpends = { ...spendAmounts, [buyerName]: numericValue };
    setSpendAmounts(newSpends);
    if (onSpendChange) {
      onSpendChange(newSpends);
    }
  };

  const getDaysOfCoverageColor = (days) => {
    if (days >= 14) return 'text-green-600';
    if (days >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Media Buyer Daily Spend</h3>
          <span className="text-sm text-gray-500">Scenario Planning</span>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-blue-600 font-medium">Available Cash</div>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-2">{formatCurrency(totalCash)}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-green-600 font-medium">Credit Available</div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-700 mt-2">{formatCurrency(totalCredit)}</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-purple-600 font-medium">Total Available</div>
              <AlertCircle className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-700 mt-2">{formatCurrency(totalAvailableFunds)}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-gray-600 font-medium">Coverage Days</div>
              <Clock className="h-5 w-5 text-gray-500" />
            </div>
            <div className={`text-2xl font-bold mt-2 ${getDaysOfCoverageColor(scenarioDaysOfCoverage)}`}>
              {scenarioDaysOfCoverage} days
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media Buyer</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Average Daily Spend</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">New Spend Scenario</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {defaultBuyers.map(buyer => (
              <tr key={buyer.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{buyer.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">{formatCurrency(buyer.averageSpend)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex justify-end">
                    <div className="relative w-32">
                      <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
                      <input
                        type="text"
                        value={spendAmounts[buyer.name]?.toLocaleString() || ''}
                        onChange={(e) => handleSpendChange(buyer.name, e.target.value)}
                        className="block w-full rounded-md border-gray-300 pl-8 pr-3 text-right focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Daily Spend</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{formatCurrency(totalAverageSpend)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{formatCurrency(totalDailySpend)}</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Days of Coverage</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{averageDaysOfCoverage} days</td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getDaysOfCoverageColor(scenarioDaysOfCoverage)}`}>
                {scenarioDaysOfCoverage} days
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default MediaBuyerSpend;