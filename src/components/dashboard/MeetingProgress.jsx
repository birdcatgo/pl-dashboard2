import React from 'react';
import { Card } from '../ui/card';

const MeetingProgress = ({ performanceData = [] }) => {
  // Get today's date and format it
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate daily totals
  const dailyTotals = performanceData.reduce((acc, entry) => {
    const date = new Date(entry['Date']).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = {
        date: new Date(entry['Date']),
        spend: 0,
        revenue: 0,
        margin: 0,
        roi: 0
      };
    }
    
    acc[date].spend += entry['Ad Spend'];
    acc[date].revenue += entry['Total Revenue'];
    acc[date].margin += (entry['Total Revenue'] - entry['Ad Spend']);
    acc[date].roi = acc[date].spend > 0 ? (acc[date].margin / acc[date].spend) * 100 : 0;
    
    return acc;
  }, {});

  // Convert to array and sort by date (most recent first)
  const dailyStats = Object.values(dailyTotals)
    .sort((a, b) => b.date - a.date)
    .slice(0, 7); // Get last 7 days

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
          <h2 className="text-lg font-semibold">Meeting Progress</h2>
          <div className="text-sm text-gray-500">{formattedDate}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad Spend
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyStats.map((day) => {
                const colors = getPerformanceColors(day.margin, day.spend);
                return (
                  <tr key={day.date.toISOString()} className={`hover:bg-gray-50 ${colors.row}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(day.spend)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(day.revenue)}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm text-right ${colors.text}`}>
                      {formatCurrency(day.margin)}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm text-right ${colors.text}`}>
                      {day.roi.toFixed(1)}%
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

export default MeetingProgress; 