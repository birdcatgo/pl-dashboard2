import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, MinusIcon, AlertTriangle, ArrowRight } from 'lucide-react';

const Highlights = ({ performanceData }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const analyzeTrend = (dailyData) => {
    if (dailyData.length < 3) return { type: 'insufficient', label: 'New' };

    // Calculate daily ROIs
    const dailyROIs = dailyData.map(d => (d.margin / d.spend) * 100);
    
    // Calculate average changes between days
    const changes = [];
    for (let i = 1; i < dailyROIs.length; i++) {
      changes.push(dailyROIs[i] - dailyROIs[i - 1]);
    }

    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const stdDev = Math.sqrt(
      changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length
    );

    // Analyze the pattern
    if (Math.abs(avgChange) < 5 && stdDev < 10) {
      return { type: 'stable', label: 'Stable' };
    }
    
    if (stdDev > 30) {
      return { type: 'volatile', label: 'Volatile' };
    }

    if (avgChange > 10) {
      return { type: 'improving', label: 'Improving' };
    }
    
    if (avgChange < -10) {
      return { type: 'declining', label: 'Declining' };
    }

    return { type: 'neutral', label: 'Neutral' };
  };

  const buyerPerformance = useMemo(() => {
    if (!performanceData) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // First, group by day to analyze trends
    const dailyData = performanceData
      .filter(entry => 
        new Date(entry.Date) >= sevenDaysAgo && 
        entry['Media Buyer'] !== 'Unknown' &&
        entry.Network !== 'Unknown' &&
        entry.Offer !== 'Unknown'
      )
      .reduce((acc, entry) => {
        const date = new Date(entry.Date).toISOString().split('T')[0];
        const key = `${entry['Media Buyer']}-${entry.Network}-${entry.Offer}`;
        
        if (!acc[key]) {
          acc[key] = {};
        }
        
        if (!acc[key][date]) {
          acc[key][date] = {
            spend: 0,
            revenue: 0,
            margin: 0
          };
        }

        acc[key][date].spend += parseFloat(entry['Ad Spend'] || 0);
        acc[key][date].revenue += parseFloat(entry['Total Revenue'] || 0);
        acc[key][date].margin += parseFloat(entry.Margin || 0);

        return acc;
      }, {});

    // Then aggregate and analyze trends
    const aggregatedData = Object.entries(dailyData).reduce((acc, [key, dates]) => {
      const [buyer, network, offer] = key.split('-');
      
      const dailyMetrics = Object.values(dates);
      const trend = analyzeTrend(dailyMetrics);
      
      const totals = dailyMetrics.reduce((sums, day) => ({
        spend: sums.spend + day.spend,
        revenue: sums.revenue + day.revenue,
        margin: sums.margin + day.margin
      }), { spend: 0, revenue: 0, margin: 0 });

      acc[key] = {
        buyer,
        network,
        offer,
        ...totals,
        trend
      };

      return acc;
    }, {});

    // Convert to array and calculate ROIs
    return Object.values(aggregatedData)
      .map(row => ({
        ...row,
        roi: (row.margin / row.spend) * 100
      }))
      .sort((a, b) => b.margin - a.margin);
  }, [performanceData]);

  const getTrendIcon = (trend) => {
    switch (trend.type) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" title="Improving" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" title="Declining" />;
      case 'stable':
        return <MinusIcon className="h-4 w-4 text-blue-500" title="Stable" />;
      case 'volatile':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" title="Volatile" />;
      case 'insufficient':
        return <ArrowRight className="h-4 w-4 text-gray-500" title="New" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-400" title="Neutral" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Buyer Performance - Last 7 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media Buyer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Network
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offer
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad Spend
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {buyerPerformance.map((row, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 ${
                    row.margin < 0 ? 'bg-red-50' : row.roi > 100 ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.buyer}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {row.network}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {row.offer}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <div className="flex justify-center items-center gap-1">
                      {getTrendIcon(row.trend)}
                      <span className="text-xs text-gray-500">{row.trend.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(row.spend)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                    <span className={row.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(row.margin)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                    <span className={`font-medium ${
                      row.roi >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(row.roi)}
                    </span>
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

export default Highlights; 