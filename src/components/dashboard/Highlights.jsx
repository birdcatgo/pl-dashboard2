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

    // Find the most recent date in the data
    const mostRecentDate = new Date(Math.max(...performanceData.map(entry => new Date(entry.Date))));
    
    // Calculate start date (7 days before most recent)
    const startDate = new Date(mostRecentDate);
    startDate.setDate(startDate.getDate() - 6); // -6 to include the most recent date (for 7 total days)
    startDate.setHours(0, 0, 0, 0);

    // Set end date to end of the most recent day
    const endDate = new Date(mostRecentDate);
    endDate.setHours(23, 59, 59, 999);

    console.log('Date Range:', {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      totalDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    });

    // First, group by day to analyze trends
    const dailyData = performanceData
      .filter(entry => {
        const entryDate = new Date(entry.Date);
        return entryDate >= startDate && 
               entryDate <= endDate && 
               entry['Media Buyer'] !== 'Unknown' &&
               entry.Network !== 'Unknown' &&
               entry.Offer !== 'Unknown';
      })
      .reduce((acc, entry) => {
        const date = new Date(entry.Date).toISOString().split('T')[0];
        
        // Special handling for Mike's ACA entries
        let key;
        if (entry['Media Buyer'] === 'Mike' && 
            ((entry.Network === 'Suited' && entry.Offer === 'ACA') || 
             (entry.Network === 'ACA' && entry.Offer === 'ACA'))) {
          // Combine Mike's ACA entries
          key = 'Mike-ACA-ACA';
        } else {
          key = `${entry['Media Buyer']}-${entry.Network}-${entry.Offer}`;
        }
        
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

        const spend = parseFloat(entry['Ad Spend'] || 0);
        const revenue = parseFloat(entry['Total Revenue'] || 0);
        
        acc[key][date].spend += spend;
        acc[key][date].revenue += revenue;
        acc[key][date].margin = acc[key][date].revenue - acc[key][date].spend;

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
        margin: sums.revenue - sums.spend
      }), { spend: 0, revenue: 0, margin: 0 });

      // For Mike's combined ACA entry
      if (key === 'Mike-ACA-ACA') {
        acc[key] = {
          buyer: 'Mike',
          network: 'ACA',
          offer: 'ACA',
          ...totals,
          trend
        };
      } else {
        acc[key] = {
          buyer,
          network,
          offer,
          ...totals,
          trend
        };
      }

      return acc;
    }, {});

    // Convert to array and calculate ROIs
    return {
      data: Object.values(aggregatedData)
        .map(row => ({
          ...row,
          roi: row.spend > 0 ? (row.margin / row.spend) * 100 : 0
        }))
        .sort((a, b) => b.margin - a.margin),
      startDate,
      endDate
    };
  }, [performanceData]);

  // Calculate date range text outside useMemo
  const dateRangeText = buyerPerformance?.startDate && buyerPerformance?.endDate
    ? `${buyerPerformance.startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })} to ${buyerPerformance.endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`
    : 'Last 7 Days';

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
        <CardTitle>Media Buyer Performance • {dateRangeText}</CardTitle>
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
              {(buyerPerformance?.data || []).map((row, index) => (
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