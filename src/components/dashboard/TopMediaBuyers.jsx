import React from 'react';
import { Card } from '../ui/card';

const TopMediaBuyers = ({ performanceData = [] }) => {
  // Process data to get top media buyers
  const mediaBuyerStats = performanceData.reduce((acc, entry) => {
    const buyer = entry['Media Buyer'];
    if (!acc[buyer]) {
      acc[buyer] = {
        name: buyer,
        spend: 0,
        revenue: 0,
        margin: 0,
        roi: 0
      };
    }
    
    acc[buyer].spend += entry['Ad Spend'];
    acc[buyer].revenue += entry['Total Revenue'];
    acc[buyer].margin += (entry['Total Revenue'] - entry['Ad Spend']);
    
    return acc;
  }, {});

  // Calculate ROI and convert to array
  const buyerList = Object.values(mediaBuyerStats)
    .map(buyer => ({
      ...buyer,
      roi: buyer.spend > 0 ? (buyer.margin / buyer.spend) * 100 : 0
    }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5); // Get top 5

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
        <h2 className="text-lg font-semibold mb-4">Top Media Buyers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media Buyer
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
              {buyerList.map((buyer) => {
                const colors = getPerformanceColors(buyer.margin, buyer.spend);
                return (
                  <tr key={buyer.name} className={`hover:bg-gray-50 ${colors.row}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {buyer.name}
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

export default TopMediaBuyers; 