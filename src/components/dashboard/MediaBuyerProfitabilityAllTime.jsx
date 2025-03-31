import React from 'react';
import { Card } from '../ui/card';

const MediaBuyerProfitabilityAllTime = ({ performanceData = [] }) => {
  // Process data to get all-time stats for each media buyer
  const allTimeData = performanceData.reduce((acc, entry) => {
    const buyer = entry['Media Buyer'];
    if (!acc[buyer]) {
      acc[buyer] = {
        name: buyer,
        spend: 0,
        revenue: 0,
        margin: 0,
        roi: 0,
        startDate: new Date(entry['Date']),
        lastDate: new Date(entry['Date']),
        totalDays: 0,
        dailyData: []
      };
    }
    
    acc[buyer].spend += entry['Ad Spend'];
    acc[buyer].revenue += entry['Total Revenue'];
    acc[buyer].margin += (entry['Total Revenue'] - entry['Ad Spend']);
    acc[buyer].dailyData.push({
      date: entry['Date'],
      spend: entry['Ad Spend'],
      revenue: entry['Total Revenue'],
      margin: entry['Total Revenue'] - entry['Ad Spend']
    });

    const entryDate = new Date(entry['Date']);
    if (entryDate < acc[buyer].startDate) acc[buyer].startDate = entryDate;
    if (entryDate > acc[buyer].lastDate) acc[buyer].lastDate = entryDate;

    return acc;
  }, {});

  // Calculate additional metrics
  Object.values(allTimeData).forEach(buyer => {
    buyer.roi = buyer.spend > 0 ? (buyer.margin / buyer.spend) * 100 : 0;
    buyer.totalDays = Math.ceil((buyer.lastDate - buyer.startDate) / (1000 * 60 * 60 * 24));
    buyer.dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  // Sort by total margin
  const sortedData = Object.values(allTimeData)
    .sort((a, b) => b.margin - a.margin);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getPerformanceColors = (margin, spend) => {
    if (margin > 0) {
      return {
        row: 'bg-green-50',
        text: 'text-green-600'
      };
    } else if (margin < 0) {
      return {
        row: 'bg-red-50',
        text: 'text-red-600'
      };
    } else {
      return {
        row: 'bg-yellow-50',
        text: 'text-yellow-600'
      };
    }
  };

  return (
    <Card className="w-full">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Media Buyer Profitability All Time</h2>
          <div className="text-sm text-gray-500">
            Showing data from {new Date(Math.min(...Object.values(allTimeData).map(b => b.startDate))).toLocaleDateString()} to {new Date(Math.max(...Object.values(allTimeData).map(b => b.lastDate))).toLocaleDateString()}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media Buyer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Days Active
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Ad Spend
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Profit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Daily Profit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((buyer) => {
                const colors = getPerformanceColors(buyer.margin, buyer.spend);
                const avgDailyProfit = buyer.totalDays > 0 ? buyer.margin / buyer.totalDays : 0;
                
                return (
                  <tr key={buyer.name} className={`hover:bg-gray-50 ${colors.row}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {buyer.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {buyer.totalDays}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(buyer.spend)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(buyer.revenue)}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm text-right ${colors.text}`}>
                      {formatCurrency(buyer.margin)}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm text-right ${colors.text}`}>
                      {buyer.roi.toFixed(1)}%
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm text-right ${colors.text}`}>
                      {formatCurrency(avgDailyProfit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default MediaBuyerProfitabilityAllTime; 