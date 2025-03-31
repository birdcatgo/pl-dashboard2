import React from 'react';
import { Card } from '../ui/card';

const TopNetworkOffers = ({ performanceData = [] }) => {
  // Process data to get top network offers
  const offerStats = performanceData.reduce((acc, entry) => {
    const offer = entry['Offer'];
    if (!acc[offer]) {
      acc[offer] = {
        name: offer,
        spend: 0,
        revenue: 0,
        margin: 0,
        roi: 0
      };
    }
    
    acc[offer].spend += entry['Ad Spend'];
    acc[offer].revenue += entry['Total Revenue'];
    acc[offer].margin += (entry['Total Revenue'] - entry['Ad Spend']);
    
    return acc;
  }, {});

  // Calculate ROI and convert to array
  const offerList = Object.values(offerStats)
    .map(offer => ({
      ...offer,
      roi: offer.spend > 0 ? (offer.margin / offer.spend) * 100 : 0
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
        <h2 className="text-lg font-semibold mb-4">Top Network Offers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offer
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
              {offerList.map((offer) => {
                const colors = getPerformanceColors(offer.margin, offer.spend);
                return (
                  <tr key={offer.name} className={`hover:bg-gray-50 ${colors.row}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {offer.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(offer.spend)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(offer.revenue)}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm text-right ${colors.text}`}>
                      {formatCurrency(offer.margin)}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm text-right ${colors.text}`}>
                      {offer.roi.toFixed(1)}%
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

export default TopNetworkOffers; 