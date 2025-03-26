import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from 'lucide-react';

const TEAM_MEETINGS = [
  '2025-03-28',
  '2025-04-04',
  '2025-04-11',
  '2025-04-15',
  '2025-04-21',
];

const MEDIA_BUYERS = [
  { name: 'Ishaan', startDate: null },
  { name: 'Edwin', startDate: null },
  { name: 'Nick N', startDate: null },
  { name: 'Mike C', startDate: null },
  { name: 'Gagan', startDate: null },
  { name: 'Omar', startDate: null },
];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const calculateRoi = (revenue, spend) => {
  if (spend === 0) return 0;
  return (revenue / spend) * 100 - 100;
};

const ThirtyDayChallenge = ({ performanceData = [] }) => {
  const [buyerData, setBuyerData] = useState(
    MEDIA_BUYERS.map(buyer => ({
      ...buyer,
      spendCheckpoints: {
        $500: false,
        $1000: false,
      },
      dailyStats: [],
      meetingAttendance: TEAM_MEETINGS.reduce((acc, date) => ({
        ...acc,
        [date]: false
      }), {}),
      notes: '',
      isExpanded: false
    }))
  );

  // Process performance data when it changes
  useEffect(() => {
    if (!performanceData?.length) return;

    const processedData = [...buyerData];
    
    // Group data by media buyer
    const buyerStats = {};
    performanceData.forEach(entry => {
      const buyerName = entry['Media Buyer'];
      if (!buyerStats[buyerName]) {
        buyerStats[buyerName] = {
          dates: [],
          stats: []
        };
      }
      
      const spend = parseFloat(entry['Ad Spend']) || 0;
      const revenue = parseFloat(entry['Total Revenue']) || 0;
      const profit = parseFloat(entry.Margin) || 0;
      
      buyerStats[buyerName].dates.push(entry.Date);
      buyerStats[buyerName].stats.push({
        date: entry.Date,
        spend,
        profit,
        revenue,
        offer: entry.Offer || '',
        network: entry.Network || '',
        adAccount: entry['Ad Account'] || '',
        roi: calculateRoi(revenue, spend)
      });
    });

    // Update each buyer's data
    processedData.forEach((buyer, idx) => {
      const stats = buyerStats[buyer.name];
      if (stats) {
        // Sort dates to find the first date
        const sortedDates = [...new Set(stats.dates)].sort();
        processedData[idx].startDate = sortedDates[0];
        
        // Group stats by date to combine multiple entries per day
        const dailyStats = stats.stats.reduce((acc, stat) => {
          const date = stat.date;
          if (!acc[date]) {
            acc[date] = {
              date,
              spend: 0,
              profit: 0,
              revenue: 0,
              offers: new Set(),
              networks: new Set()
            };
          }
          acc[date].spend += stat.spend;
          acc[date].profit += stat.profit;
          acc[date].revenue += stat.revenue;
          acc[date].offers.add(stat.offer);
          acc[date].networks.add(stat.network);
          return acc;
        }, {});

        // Convert back to array and calculate ROI
        processedData[idx].dailyStats = Object.values(dailyStats)
          .map(day => ({
            ...day,
            offers: Array.from(day.offers).filter(Boolean),
            networks: Array.from(day.networks).filter(Boolean),
            roi: calculateRoi(day.revenue, day.spend)
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Check spend checkpoints and calculate status
        const totalSpend = processedData[idx].dailyStats.reduce((sum, day) => sum + day.spend, 0);
        const latestStats = processedData[idx].dailyStats[0] || { spend: 0, roi: 0 };
        
        processedData[idx].spendCheckpoints = {
          $500: totalSpend >= 500,
          $1000: totalSpend >= 1000,
        };

        // Determine buyer's status based on progress
        let status;
        if (!processedData[idx].startDate) {
          status = "Not Started - Ready to begin running traffic";
        } else if (totalSpend < 500) {
          status = "Testing Phase - Focus on finding winning campaigns";
        } else if (totalSpend >= 500 && totalSpend < 1000) {
          if (latestStats.roi > 0) {
            status = "Scaling Phase - Increase spend on profitable campaigns";
          } else {
            status = "Optimization Phase - Improve ROI before scaling further";
          }
        } else {
          if (latestStats.roi > 0) {
            status = "Advanced Scaling - Maximize profitable campaigns";
          } else {
            status = "Recovery Phase - Optimize or pivot to better performing offers";
          }
        }
        
        processedData[idx].status = status;
      }
    });

    setBuyerData(processedData);
  }, [performanceData]);

  const getStatusColor = (stats) => {
    if (!stats || stats.length === 0) return '';
    
    // Check for $250+ profit day
    if (stats[0]?.profit >= 250) return 'bg-green-100';
    
    // Check for $250+ loss day
    if (stats[0]?.profit <= -250) return 'bg-red-100';
    
    // Check for 3+ days of continuous losses
    const lastThreeDays = stats.slice(0, 3);
    if (lastThreeDays.length === 3 && 
        lastThreeDays.every(day => day.profit < 0)) {
      return 'bg-orange-100';
    }
    
    // Breakeven (within ±5%)
    if (Math.abs(stats[0]?.profit) < stats[0]?.spend * 0.05) {
      return 'bg-yellow-100';
    }
    
    return '';
  };

  const getDaysSinceStart = (startDate) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const today = new Date();
    return Math.floor((today - start) / (1000 * 60 * 60 * 24));
  };

  const toggleExpand = (idx) => {
    const newData = [...buyerData];
    newData[idx].isExpanded = !newData[idx].isExpanded;
    setBuyerData(newData);
  };

  const getRoiStatusColor = (roi) => {
    if (roi > 0) return 'text-green-600';
    if (roi === 0) return 'text-gray-600';
    return 'text-red-600';
  };

  const formatRoi = (roi) => {
    return `${roi.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>30 Day Challenge - Media Buyer Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Since Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spend</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Profit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {buyerData.map((buyer, idx) => (
                <React.Fragment key={buyer.name}>
                  <tr className={`${getStatusColor(buyer.dailyStats)} hover:bg-gray-50`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{buyer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{getDaysSinceStart(buyer.startDate)}</span>
                        {buyer.startDate && <span className="text-xs text-gray-500">({buyer.startDate})</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{formatDate(buyer.startDate)}</span>
                        {buyer.startDate && <span className="text-xs text-gray-500">({buyer.startDate})</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{buyer.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(buyer.dailyStats.reduce((sum, day) => sum + day.spend, 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(buyer.dailyStats.reduce((sum, day) => sum + day.revenue, 0))}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                      buyer.dailyStats.reduce((sum, day) => sum + day.profit, 0) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(buyer.dailyStats.reduce((sum, day) => sum + day.profit, 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => toggleExpand(idx)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {buyer.isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                  {buyer.isExpanded && buyer.dailyStats.length > 0 && (
                    <tr>
                      <td colSpan="12" className="px-6 py-4 bg-gray-50">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Spend</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Revenue</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Profit</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ROI</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Offers</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Networks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {buyer.dailyStats.map((day, dayIdx) => (
                                <tr key={day.date} className="hover:bg-gray-100">
                                  <td className="px-4 py-2 text-sm">{formatDate(day.date)}</td>
                                  <td className="px-4 py-2 text-sm">{formatCurrency(day.spend)}</td>
                                  <td className="px-4 py-2 text-sm">{formatCurrency(day.revenue)}</td>
                                  <td className="px-4 py-2 text-sm">{formatCurrency(day.profit)}</td>
                                  <td className={`px-4 py-2 text-sm font-medium ${getRoiStatusColor(day.roi)}`}>
                                    {formatRoi(day.roi)}
                                  </td>
                                  <td className="px-4 py-2 text-sm">{day.offers.join(', ') || '-'}</td>
                                  <td className="px-4 py-2 text-sm">{day.networks.join(', ') || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThirtyDayChallenge; 