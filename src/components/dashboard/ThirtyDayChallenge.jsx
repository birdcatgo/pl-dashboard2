import React, { useState } from 'react';
import { Card } from '../ui/card';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getStatus = (buyer) => {
  if (buyer.spend === 0) return '';
  
  const daysSinceStart = Math.floor((new Date() - new Date(buyer.startDate)) / (1000 * 60 * 60 * 24));
  
  if (daysSinceStart <= 3) {
    return 'Testing Phase - Focus on finding winning campaigns';
  } else if (buyer.margin < 0) {
    return 'Recovery Phase - Optimize or pivot to better performing offers';
  } else if (buyer.roi > 20) {
    return 'Advanced Scaling - Maximize profitable campaigns';
  } else {
    return 'Growth Phase - Optimize and scale profitable campaigns';
  }
};

const getPerformanceColors = (margin, spend) => {
  // Extreme cases with brighter colors
  if (margin >= 1000) return { row: 'bg-green-100', text: 'text-green-700 font-semibold' }; // Very profitable
  if (margin <= -500) return { row: 'bg-red-100', text: 'text-red-700 font-semibold' }; // Very unprofitable
  
  // Standard cases
  if (margin >= 250) return { row: 'bg-green-50', text: 'text-green-600' };
  if (margin < 0) return { row: 'bg-red-50', text: 'text-red-600' };
  if (Math.abs(margin) < spend * 0.05) return { row: 'bg-yellow-50', text: 'text-yellow-600' };
  return { row: '', text: 'text-gray-900' };
};

const TrendGraph = ({ data, color = 'blue' }) => {
  if (!data || data.length === 0) return null;

  const width = 150; // Increased width for better visibility
  const height = 30;
  const padding = 2;

  // Normalize data to fit within graph height
  const values = data.map(d => d.margin);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  // If all values are the same, create a flat line
  if (range === 0) {
    const y = height / 2;
    return (
      <svg width={width} height={height} className="inline-block">
        <line
          x1={padding}
          y1={y}
          x2={width - padding}
          y2={y}
          stroke={color}
          strokeWidth="2"
        />
      </svg>
    );
  }

  // Create points for the line
  const points = values.map((value, i) => {
    const x = padding + (i * (width - 2 * padding)) / (values.length - 1);
    const y = height - padding - ((value - min) * (height - 2 * padding)) / range;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="inline-block">
      <path
        d={`M ${points.join(' L ')}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const ThirtyDayChallenge = ({ performanceData = [] }) => {
  const [expandedBuyers, setExpandedBuyers] = useState(new Set());

  const toggleBuyerExpansion = (buyerName) => {
    const newExpanded = new Set(expandedBuyers);
    if (newExpanded.has(buyerName)) {
      newExpanded.delete(buyerName);
    } else {
      newExpanded.add(buyerName);
    }
    setExpandedBuyers(newExpanded);
  };

  // Process data for 30-day challenge
  const thirtyDayChallengeData = performanceData.reduce((acc, entry) => {
    const buyer = entry['Media Buyer'];
    // Filter out inactive media buyers and unknown
    if (!buyer || 
        buyer.toLowerCase() === 'unknown' || 
        ['Dave', 'Asheesh', 'Alex'].includes(buyer)) return acc;

    let buyerData = acc.find(b => b.name === buyer);
    if (!buyerData) {
      buyerData = {
        name: buyer,
        startDate: entry.Date,
        spend: 0,
        revenue: 0,
        margin: 0,
        roi: 0,
        lastDate: entry.Date,
        dailyData: []
      };
      acc.push(buyerData);
    }

    // Update last date if this entry is more recent
    if (new Date(entry.Date) > new Date(buyerData.lastDate)) {
      buyerData.lastDate = entry.Date;
    }

    const spend = parseFloat(entry['Ad Spend'] || 0);
    const revenue = parseFloat(entry['Total Revenue'] || 0);
    const margin = revenue - spend;

    buyerData.spend += spend;
    buyerData.revenue += revenue;
    buyerData.margin += margin;
    buyerData.roi = buyerData.spend > 0 ? (buyerData.margin / buyerData.spend) * 100 : 0;

    // Add daily data
    buyerData.dailyData.push({
      date: entry.Date,
      spend,
      revenue,
      margin,
      roi: spend > 0 ? (margin / spend) * 100 : 0
    });

    return acc;
  }, []);

  // Calculate the date range (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Process each buyer's data
  const filteredData = thirtyDayChallengeData
    .map(buyer => {
      // Filter daily data to only include the last 30 days
      const filteredDailyData = buyer.dailyData.filter(day => 
        new Date(day.date) >= thirtyDaysAgo
      );

      // Recalculate totals based on filtered daily data
      const totals = filteredDailyData.reduce((acc, day) => ({
        spend: acc.spend + day.spend,
        revenue: acc.revenue + day.revenue,
        margin: acc.margin + day.margin
      }), { spend: 0, revenue: 0, margin: 0 });

      return {
        ...buyer,
        spend: totals.spend,
        revenue: totals.revenue,
        margin: totals.margin,
        roi: totals.spend > 0 ? (totals.margin / totals.spend) * 100 : 0,
        dailyData: filteredDailyData
      };
    })
    // Filter out buyers with $0 spend
    .filter(buyer => buyer.spend > 0);

  // Sort by most recent start date
  filteredData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  return (
    <Card className="w-full">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">30 Day Challenge - Media Buyer Progress</h2>
          <div className="text-sm text-gray-500">
            Showing data from {thirtyDaysAgo.toLocaleDateString()} to {today.toLocaleDateString()}
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
                  Days Since Start
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad Spend Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50" title="10% of Margin">
                  MB Comm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData
                .filter(buyer => buyer.name !== 'Unknown')
                .map((buyer) => {
                  const roi = buyer.spend > 0 ? (buyer.margin / buyer.spend) * 100 : 0;
                  const daysSinceStart = Math.floor((new Date() - new Date(buyer.startDate)) / (1000 * 60 * 60 * 24));
                  const status = getStatus(buyer);
                  const commission = buyer.margin > 0 ? buyer.margin * 0.10 : 0;
                  const colors = getPerformanceColors(buyer.margin, buyer.spend);
                  
                  return (
                    <React.Fragment key={buyer.name}>
                      <tr 
                        className={`hover:bg-gray-50 ${colors.row} cursor-pointer`}
                        onClick={() => toggleBuyerExpansion(buyer.name)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                          <span className="mr-2">
                            {expandedBuyers.has(buyer.name) ? '▼' : '▶'}
                          </span>
                          {buyer.name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {daysSinceStart}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {status}
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
                          {roi.toFixed(1)}%
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right bg-blue-50">
                          {formatCurrency(commission)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <TrendGraph 
                            data={buyer.dailyData} 
                            color={colors.text.includes('green') ? '#059669' : 
                                   colors.text.includes('red') ? '#dc2626' : 
                                   colors.text.includes('yellow') ? '#ca8a04' : 
                                   '#1f2937'}
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBuyerExpansion(buyer.name);
                            }}
                          >
                            {expandedBuyers.has(buyer.name) ? 'Hide' : 'Show'} Details
                          </button>
                        </td>
                      </tr>
                      {expandedBuyers.has(buyer.name) && (
                        <tr>
                          <td colSpan="9" className="px-4 py-4 bg-gray-50">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Ad Spend</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Profit</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">ROI</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {buyer.dailyData
                                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                                    .map((day, index) => {
                                      const dayColors = getPerformanceColors(day.margin, day.spend);
                                      return (
                                        <tr key={day.date} className="hover:bg-gray-100">
                                          <td className="px-4 py-2 text-sm">{new Date(day.date).toLocaleDateString()}</td>
                                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(day.spend)}</td>
                                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(day.revenue)}</td>
                                          <td className={`px-4 py-2 text-sm text-right ${dayColors.text}`}>
                                            {formatCurrency(day.margin)}
                                          </td>
                                          <td className={`px-4 py-2 text-sm text-right ${dayColors.text}`}>
                                            {day.roi.toFixed(1)}%
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default ThirtyDayChallenge; 