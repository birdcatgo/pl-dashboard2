import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value) => {
  if (!value && value !== 0) return '–';
  return `${value.toFixed(1)}%`;
};

const calculateChange = (currentSpend, previousSpend) => {
  if (!previousSpend) return null;
  return ((currentSpend - previousSpend) / previousSpend) * 100;
};

const MediaBuyerTable = ({ performanceData }) => {
  // Group and calculate metrics by media buyer and offer
  const buyerMetrics = React.useMemo(() => {
    if (!performanceData?.length) return [];

    const today = new Date();
    const weekdayData = performanceData.filter(entry => {
      const date = new Date(entry.Date);
      const day = date.getDay();
      return day >= 1 && day <= 5; // Monday to Friday
    });

    // Group by media buyer and offer
    const groupedData = weekdayData.reduce((acc, entry) => {
      const key = `${entry['Media Buyer']}-${entry.Offer}`;
      if (!acc[key]) {
        acc[key] = {
          mediaBuyer: entry['Media Buyer'],
          offer: entry.Offer,
          currentSpend: 0,
          previousSpend: 0,
          revenue: 0,
          count: 0
        };
      }

      const spend = parseFloat(entry['Ad Spend'] || 0);
      const revenue = parseFloat(entry['Total Revenue'] || 0);
      
      acc[key].currentSpend += spend;
      acc[key].revenue += revenue;
      acc[key].count++;

      return acc;
    }, {});

    // Calculate daily averages and metrics
    return Object.values(groupedData).map(item => ({
      mediaBuyer: item.mediaBuyer,
      offer: item.offer,
      dailySpend: item.count ? item.currentSpend / item.count : 0,
      dailyRevenue: item.count ? item.revenue / item.count : 0,
      profit: item.revenue - item.currentSpend,
      roi: item.currentSpend > 0 ? ((item.revenue / item.currentSpend) - 1) * 100 : 0,
      change: calculateChange(item.currentSpend, item.previousSpend)
    })).sort((a, b) => b.dailySpend - a.dailySpend);
  }, [performanceData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Buyer Performance</CardTitle>
        <p className="text-sm text-gray-500">Weekday averages (Mon-Fri)</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Buyer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Ad Spend</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Profit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {buyerMetrics.map((row, index) => (
                <tr key={`${row.mediaBuyer}-${row.offer}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-900">{row.mediaBuyer}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{row.offer}</td>
                  <td className="px-4 py-4 text-sm text-right">{formatCurrency(row.dailySpend)}</td>
                  <td className="px-4 py-4 text-sm text-right">{formatCurrency(row.dailyRevenue)}</td>
                  <td className={`px-4 py-4 text-sm text-right ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(row.profit)}
                  </td>
                  <td className={`px-4 py-4 text-sm text-right ${row.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(row.roi)}
                  </td>
                  <td className={`px-4 py-4 text-sm text-right ${
                    row.change > 0 ? 'text-green-600' : row.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {row.change !== null ? formatPercent(row.change) : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaBuyerTable; 