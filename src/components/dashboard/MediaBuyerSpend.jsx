import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, startOfDay, subDays } from 'date-fns';

const formatCurrency = (amount) => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount.replace(/[\$,]/g, '') || 0);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const MediaBuyerSpend = ({ onSpendChange, cashManagementData, performanceData }) => {
  // Get the most recent date from performance data
  const getLatestDate = () => {
    if (!performanceData?.length) return null;
    // Since we don't have a Date column in the CSV, we'll use current date for now
    // TODO: Add date column to performance data
    return new Date();
  };

  // Calculate average spend for last period
  const calculateAverageSpend = (buyerName) => {
    if (!performanceData?.length) return 0;
    
    const buyerData = performanceData.filter(d => 
      d['Media Buyer'] === buyerName && 
      d['Total Ad Spend'] && 
      d['Total Ad Spend'] !== '$0.00'
    );

    if (!buyerData.length) return 0;

    const totalSpend = buyerData.reduce((sum, d) => {
      const spend = parseFloat(d['Total Ad Spend'].replace(/[$,]/g, '')) || 0;
      return sum + spend;
    }, 0);

    // Since this is total spend, we'll divide by a period (e.g., 30 days) to get daily average
    return totalSpend / 30;
  };

  const defaultBuyers = [
    { name: 'Zel', averageSpend: calculateAverageSpend('Zel') || 2000 },
    { name: 'Daniel', averageSpend: calculateAverageSpend('Daniel') || 15000 },
    { name: 'Mike', averageSpend: calculateAverageSpend('Mike') || 10000 },
    { name: 'Dave', averageSpend: calculateAverageSpend('Dave') || 2000 },
    { name: 'Asheesh', averageSpend: calculateAverageSpend('Asheesh') || 10000 }
  ];

  const [spendAmounts, setSpendAmounts] = useState(() =>
    defaultBuyers.reduce((acc, buyer) => ({
      ...acc,
      [buyer.name]: buyer.averageSpend
    }), {})
  );

  const totalCash = cashManagementData?.currentBalance || 0;
  const totalCredit = cashManagementData?.creditAvailable || 0;
  const totalAvailable = totalCash + totalCredit;

  const totalAverageSpend = defaultBuyers.reduce((sum, buyer) => sum + buyer.averageSpend, 0);
  const totalDailySpend = Object.values(spendAmounts).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);

  const averageDaysOfCoverage = totalAvailable / totalAverageSpend;
  const scenarioDaysOfCoverage = totalDailySpend > 0 ? totalAvailable / totalDailySpend : 0;

  useEffect(() => {
    if (onSpendChange) {
      onSpendChange(totalDailySpend);
    }
  }, [totalDailySpend, onSpendChange]);

  const handleSpendChange = (buyerName, value) => {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    const numericValue = parseFloat(cleanValue) || 0;

    setSpendAmounts(prev => ({
      ...prev,
      [buyerName]: numericValue
    }));
  };

  const getDaysOfCoverageColor = (days) => {
    if (days >= 14) return 'text-green-600';
    if (days >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Media Buyer Daily Spend
          </div>
          {getLatestDate() && (
            <div className="text-sm text-gray-500">
              Based on data up to {format(getLatestDate(), 'MMM d, yyyy')}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Buyer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Average Daily</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Scenario Daily</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {defaultBuyers.map((buyer) => (
                <tr key={buyer.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {buyer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(buyer.averageSpend)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                        $
                      </span>
                      <input
                        type="text"
                        value={spendAmounts[buyer.name] || ''}
                        onChange={(e) => handleSpendChange(buyer.name, e.target.value)}
                        className="form-input rounded-md border-gray-300 w-full text-right pl-8"
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-4 text-sm text-gray-900">Total Daily Spend</td>
                <td className="px-6 py-4 text-sm text-right">{formatCurrency(totalAverageSpend)}</td>
                <td className="px-6 py-4 text-sm text-right">{formatCurrency(totalDailySpend)}</td>
              </tr>
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-4 text-sm text-gray-900">Days of Coverage</td>
                <td className="px-6 py-4 text-sm text-right">{averageDaysOfCoverage.toFixed(1)} days</td>
                <td className={`px-6 py-4 text-sm text-right ${getDaysOfCoverageColor(scenarioDaysOfCoverage)}`}>
                  {scenarioDaysOfCoverage.toFixed(1)} days
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-start gap-2 text-sm text-gray-500">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>
            Days of coverage is calculated using total available funds (cash + credit) divided by daily spend.
            {scenarioDaysOfCoverage < 7 && (
              <span className="text-red-600 ml-1">
                Warning: Current scenario provides less than 7 days of coverage.
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaBuyerSpend;