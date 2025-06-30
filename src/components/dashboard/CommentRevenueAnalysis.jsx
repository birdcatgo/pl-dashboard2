import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [month, day, year] = dateStr.split('/');
  if (!month || !day || !year) return null;
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
};

export default function CommentRevenueAnalysis({ performanceData }) {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  // June 1st, 2024 - start of comment revenue tracking
  const june1st2024 = new Date(2024, 5, 1); // Note: month is 0-indexed

  // Process and filter data based on selected period
  const processedData = useMemo(() => {
    console.log('CommentRevenueAnalysis - Input data:', {
      hasPerformanceData: !!performanceData,
      hasData: !!performanceData?.data,
      dataLength: performanceData?.data?.length,
      sampleEntry: performanceData?.data?.[0],
      selectedPeriod
    });

    if (!performanceData?.data || !Array.isArray(performanceData.data)) {
      console.log('CommentRevenueAnalysis - No performance data available');
      return { dailyData: [], summaryData: [] };
    }

    const now = new Date();
    let startDate;
    let effectivePeriod = selectedPeriod;
    
    switch (selectedPeriod) {
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        break;
      case 'lastMonth':
        startDate = startOfMonth(subDays(startOfMonth(now), 1));
        break;
      case 'sinceJune':
        startDate = june1st2024;
        break;
      default:
        startDate = startOfMonth(now);
    }

    // Apply June 1st minimum date
    if (startDate < june1st2024) {
      startDate = june1st2024;
    }

    console.log('CommentRevenueAnalysis - Date filtering:', {
      now: now.toISOString(),
      startDate: startDate.toISOString(),
      june1st2024: june1st2024.toISOString(),
      selectedPeriod
    });

    // Filter data for the selected period
    let filteredData = performanceData.data.filter(entry => {
      const entryDate = parseDate(entry.Date);
      if (!entryDate) {
        console.log('CommentRevenueAnalysis - Invalid date entry:', entry.Date);
        return false;
      }
      const isInRange = entryDate >= startDate && entryDate <= now;
      if (entry['Comment Revenue'] > 0) {
        console.log('CommentRevenueAnalysis - Found comment revenue entry:', {
          date: entry.Date,
          parsedDate: entryDate.toISOString(),
          commentRevenue: entry['Comment Revenue'],
          isInRange,
          startDate: startDate.toISOString(),
          now: now.toISOString()
        });
      }
      return isInRange;
    });

    // If no comment revenue data found in current period, try to find the most recent data
    const commentRevenueEntries = filteredData.filter(entry => entry['Comment Revenue'] > 0);
    if (commentRevenueEntries.length === 0) {
      console.log('CommentRevenueAnalysis - No comment revenue data in current period, searching for recent data');
      
      // Find all comment revenue entries and get the most recent date
      const allCommentRevenueEntries = performanceData.data.filter(entry => entry['Comment Revenue'] > 0);
      if (allCommentRevenueEntries.length > 0) {
        const mostRecentEntry = allCommentRevenueEntries.reduce((latest, entry) => {
          const entryDate = parseDate(entry.Date);
          const latestDate = parseDate(latest.Date);
          return entryDate > latestDate ? entry : latest;
        });
        
        const mostRecentDate = parseDate(mostRecentEntry.Date);
        console.log('CommentRevenueAnalysis - Most recent comment revenue:', {
          date: mostRecentEntry.Date,
          commentRevenue: mostRecentEntry['Comment Revenue'],
          network: mostRecentEntry.Network,
          offer: mostRecentEntry.Offer
        });
        
        // Set start date to 30 days before the most recent entry
        const fallbackStartDate = subDays(mostRecentDate, 30);
        startDate = fallbackStartDate < june1st2024 ? june1st2024 : fallbackStartDate;
        effectivePeriod = 'recent';
        
        // Re-filter with the new date range
        filteredData = performanceData.data.filter(entry => {
          const entryDate = parseDate(entry.Date);
          if (!entryDate) return false;
          return entryDate >= startDate && entryDate <= mostRecentDate;
        });
        
        console.log('CommentRevenueAnalysis - Using fallback date range:', {
          startDate: startDate.toISOString(),
          endDate: mostRecentDate.toISOString(),
          filteredLength: filteredData.length,
          commentRevenueEntries: filteredData.filter(entry => entry['Comment Revenue'] > 0).length
        });
      }
    }

    console.log('CommentRevenueAnalysis - Filtered data:', {
      originalLength: performanceData.data.length,
      filteredLength: filteredData.length,
      commentRevenueEntries: filteredData.filter(entry => entry['Comment Revenue'] > 0).length,
      sampleFilteredEntry: filteredData[0],
      effectivePeriod
    });

    // Group by date for daily chart
    const dailyMap = new Map();
    
    filteredData.forEach(entry => {
      const entryDate = parseDate(entry.Date);
      if (!entryDate) return;
      
      const dateKey = format(entryDate, 'yyyy-MM-dd');
      const commentRevenue = parseFloat(entry['Comment Revenue'] || 0);
      const adSpend = parseFloat(entry['Ad Spend'] || 0);
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          displayDate: format(entryDate, 'MMM d'),
          fullDate: entryDate,
          commentRevenue: 0,
          adSpend: 0
        });
      }
      
      const dayData = dailyMap.get(dateKey);
      dayData.commentRevenue += commentRevenue;
      dayData.adSpend += adSpend;
    });

    // Convert to array and calculate percentages
    const dailyData = Array.from(dailyMap.values())
      .map(day => ({
        ...day,
        commentRevenuePercentage: day.adSpend > 0 ? (day.commentRevenue / day.adSpend) * 100 : 0
      }))
      .sort((a, b) => a.fullDate - b.fullDate);

    console.log('CommentRevenueAnalysis - Final processed data:', {
      dailyDataLength: dailyData.length,
      dailyDataWithCommentRevenue: dailyData.filter(day => day.commentRevenue > 0).length,
      sampleDailyData: dailyData.slice(0, 3),
      effectivePeriod
    });

    return { dailyData, filteredData, effectivePeriod };
  }, [performanceData, selectedPeriod]);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const { dailyData } = processedData;
    
    const totalCommentRevenue = dailyData.reduce((sum, day) => sum + day.commentRevenue, 0);
    const totalAdSpend = dailyData.reduce((sum, day) => sum + day.adSpend, 0);
    const daysWithCommentRevenue = dailyData.filter(day => day.commentRevenue > 0).length;
    const averageCommentRevenue = dailyData.length > 0 ? totalCommentRevenue / dailyData.length : 0;
    const averagePercentage = totalAdSpend > 0 ? (totalCommentRevenue / totalAdSpend) * 100 : 0;
    
    // Find best day
    const bestDay = dailyData.reduce((best, day) => {
      return (!best || day.commentRevenue > best.commentRevenue) ? day : best;
    }, null);
    
    // Calculate trend (simple: first half vs second half)
    const midPoint = Math.floor(dailyData.length / 2);
    const firstHalf = dailyData.slice(0, midPoint);
    const secondHalf = dailyData.slice(midPoint);
    const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, day) => sum + day.commentRevenue, 0) / firstHalf.length : 0;
    const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, day) => sum + day.commentRevenue, 0) / secondHalf.length : 0;
    const trend = secondHalfAvg - firstHalfAvg;

    return {
      totalCommentRevenue,
      averageCommentRevenue,
      averagePercentage,
      daysWithCommentRevenue,
      totalDays: dailyData.length,
      bestDay,
      trend
    };
  }, [processedData]);

  // Network breakdown
  const networkData = useMemo(() => {
    const { filteredData } = processedData;
    
    const networkMap = new Map();
    
    // First pass: Calculate total ad spend for all networks
    const networkAdSpend = new Map();
    filteredData.forEach(entry => {
      const network = entry.Network || 'Unknown';
      const adSpend = parseFloat(entry['Ad Spend'] || 0);
      
      if (!networkAdSpend.has(network)) {
        networkAdSpend.set(network, 0);
      }
      networkAdSpend.set(network, networkAdSpend.get(network) + adSpend);
    });
    
    // Second pass: Process entries with comment revenue
    filteredData.forEach(entry => {
      const commentRevenue = parseFloat(entry['Comment Revenue'] || 0);
      
      // Only process entries that have comment revenue
      if (commentRevenue > 0) {
        const network = entry.Network || 'Unknown';
        if (!networkMap.has(network)) {
          networkMap.set(network, { 
            name: network, 
            commentRevenue: 0, 
            adSpend: networkAdSpend.get(network) || 0,
            entries: 0 
          });
        }
        const networkData = networkMap.get(network);
        networkData.commentRevenue += commentRevenue;
        networkData.entries += 1;
      }
    });

    return Array.from(networkMap.values())
      .map(item => ({
        ...item,
        percentage: item.adSpend > 0 ? (item.commentRevenue / item.adSpend) * 100 : 0
      }))
      .sort((a, b) => b.commentRevenue - a.commentRevenue);
  }, [processedData]);

  // Offer breakdown
  const offerData = useMemo(() => {
    const { filteredData } = processedData;
    
    const offerMap = new Map();
    
    // First pass: Calculate total ad spend for all offers
    const offerAdSpend = new Map();
    filteredData.forEach(entry => {
      const offer = entry.Offer || 'Unknown';
      const adSpend = parseFloat(entry['Ad Spend'] || 0);
      
      if (!offerAdSpend.has(offer)) {
        offerAdSpend.set(offer, 0);
      }
      offerAdSpend.set(offer, offerAdSpend.get(offer) + adSpend);
    });
    
    // Second pass: Process entries with comment revenue
    filteredData.forEach(entry => {
      const commentRevenue = parseFloat(entry['Comment Revenue'] || 0);
      
      // Only process entries that have comment revenue
      if (commentRevenue > 0) {
        const offer = entry.Offer || 'Unknown';
        if (!offerMap.has(offer)) {
          offerMap.set(offer, { 
            name: offer, 
            commentRevenue: 0, 
            adSpend: offerAdSpend.get(offer) || 0,
            entries: 0 
          });
        }
        const offerData = offerMap.get(offer);
        offerData.commentRevenue += commentRevenue;
        offerData.entries += 1;
      }
    });

    return Array.from(offerMap.values())
      .map(item => ({
        ...item,
        percentage: item.adSpend > 0 ? (item.commentRevenue / item.adSpend) * 100 : 0
      }))
      .sort((a, b) => b.commentRevenue - a.commentRevenue);
  }, [processedData]);

  // Daily details breakdown
  const dailyDetailsData = useMemo(() => {
    const { filteredData } = processedData;
    
    const dailyMap = new Map();
    
    // First pass: calculate total ad spend for all days
    const dailyTotals = new Map();
    filteredData.forEach(entry => {
      const entryDate = parseDate(entry.Date);
      if (!entryDate) return;
      
      const dateKey = format(entryDate, 'yyyy-MM-dd');
      const adSpend = parseFloat(entry['Ad Spend'] || 0);
      
      if (!dailyTotals.has(dateKey)) {
        dailyTotals.set(dateKey, { totalAdSpend: 0 });
      }
      dailyTotals.get(dateKey).totalAdSpend += adSpend;
    });
    
    // Second pass: calculate ad spend by network/offer for each day
    const dailyNetworkOfferSpend = new Map();
    filteredData.forEach(entry => {
      const entryDate = parseDate(entry.Date);
      if (!entryDate) return;
      
      const dateKey = format(entryDate, 'yyyy-MM-dd');
      const network = entry.Network || 'Unknown';
      const offer = entry.Offer || 'Unknown';
      const adSpend = parseFloat(entry['Ad Spend'] || 0);
      
      const comboKey = `${dateKey}-${network}-${offer}`;
      if (!dailyNetworkOfferSpend.has(comboKey)) {
        dailyNetworkOfferSpend.set(comboKey, 0);
      }
      dailyNetworkOfferSpend.set(comboKey, dailyNetworkOfferSpend.get(comboKey) + adSpend);
    });
    
    // Third pass: process entries with comment revenue
    filteredData.forEach(entry => {
      const entryDate = parseDate(entry.Date);
      if (!entryDate) return;
      
      const dateKey = format(entryDate, 'yyyy-MM-dd');
      const commentRevenue = parseFloat(entry['Comment Revenue'] || 0);
      
      if (commentRevenue > 0) {
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, {
            date: dateKey,
            displayDate: format(entryDate, 'MMM d, yyyy'),
            fullDate: entryDate,
            totalCommentRevenue: 0,
            totalAdSpend: dailyTotals.get(dateKey)?.totalAdSpend || 0,
            entries: []
          });
        }
        
        const dayData = dailyMap.get(dateKey);
        dayData.totalCommentRevenue += commentRevenue;
        
        const network = entry.Network || 'Unknown';
        const offer = entry.Offer || 'Unknown';
        const comboKey = `${dateKey}-${network}-${offer}`;
        
        dayData.entries.push({
          network: network,
          offer: offer,
          commentRevenue: commentRevenue,
          adSpend: dailyNetworkOfferSpend.get(comboKey) || 0
        });
      }
    });

    return Array.from(dailyMap.values())
      .sort((a, b) => b.fullDate - a.fullDate);
  }, [processedData]);

  // Comparison table data
  const comparisonData = useMemo(() => {
    const { filteredData } = processedData;
    
    const dailyComparison = new Map();
    
    filteredData.forEach(entry => {
      const entryDate = parseDate(entry.Date);
      if (!entryDate) return;
      
      const dateKey = format(entryDate, 'yyyy-MM-dd');
      const commentRevenue = parseFloat(entry['Comment Revenue'] || 0);
      const adSpend = parseFloat(entry['Ad Spend'] || 0);
      
      if (!dailyComparison.has(dateKey)) {
        dailyComparison.set(dateKey, {
          date: dateKey,
          displayDate: format(entryDate, 'MMM d'),
          fullDate: entryDate,
          commentRevenue: 0,
          adSpend: 0
        });
      }
      
      const dayData = dailyComparison.get(dateKey);
      dayData.commentRevenue += commentRevenue;
      dayData.adSpend += adSpend;
    });

    return Array.from(dailyComparison.values())
      .map(day => ({
        ...day,
        commentPercentage: day.adSpend > 0 ? (day.commentRevenue / day.adSpend) * 100 : 0,
        efficiency: day.commentRevenue > 0 ? day.adSpend / day.commentRevenue : 0
      }))
      .sort((a, b) => b.fullDate - a.fullDate);
  }, [processedData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      {/* Summary Metrics Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Comment Revenue Overview</CardTitle>
            <div className="flex gap-2">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="sinceJune">Since June 1st</option>
              </select>
            </div>
          </div>
          {processedData.effectivePeriod === 'recent' && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                📝 Showing most recent comment revenue data (no current period data available)
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total Comment Revenue</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(summaryMetrics.totalCommentRevenue)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Avg Daily Comment Revenue</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(summaryMetrics.averageCommentRevenue)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Comment Revenue % of Ad Spend</p>
              <p className="text-2xl font-bold text-purple-700">
                {formatPercentage(summaryMetrics.averagePercentage)}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600 font-medium">Days with Comment Revenue</p>
              <p className="text-2xl font-bold text-orange-700">
                {summaryMetrics.daysWithCommentRevenue} / {summaryMetrics.totalDays}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue vs Spend Comparison Card */}
      <Card>
        <CardHeader>
          <CardTitle>Comment Revenue vs Ad Spend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Total Period</p>
                <p className="text-lg font-bold text-blue-700">
                  {comparisonData.reduce((sum, day) => sum + day.commentRevenue, 0) > 0 
                    ? formatPercentage((comparisonData.reduce((sum, day) => sum + day.commentRevenue, 0) / 
                       comparisonData.reduce((sum, day) => sum + day.adSpend, 0)) * 100)
                    : '0%'
                  }
                </p>
                <p className="text-xs text-blue-600">Avg Comment % of Spend</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Best Day</p>
                <p className="text-lg font-bold text-green-700">
                  {comparisonData.length > 0 
                    ? formatPercentage(Math.max(...comparisonData.map(d => d.commentPercentage)))
                    : '0%'
                  }
                </p>
                <p className="text-xs text-green-600">Highest Comment %</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">Days with Comments</p>
                <p className="text-lg font-bold text-purple-700">
                  {comparisonData.filter(d => d.commentRevenue > 0).length} / {comparisonData.length}
                </p>
                <p className="text-xs text-purple-600">Revenue generating days</p>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-right">Ad Spend</th>
                      <th className="p-3 text-right">Comment Revenue</th>
                      <th className="p-3 text-right">Comment %</th>
                      <th className="p-3 text-right">Ad Spend per $1 Comment</th>
                      <th className="p-3 text-center">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((day, index) => (
                      <tr key={day.date} className={`border-t ${day.commentRevenue > 0 ? 'bg-blue-25' : ''}`}>
                        <td className="p-3 font-medium">{day.displayDate}</td>
                        <td className="p-3 text-right">{formatCurrency(day.adSpend)}</td>
                        <td className="p-3 text-right font-medium">
                          <span className={day.commentRevenue > 0 ? 'text-blue-600' : 'text-gray-400'}>
                            {formatCurrency(day.commentRevenue)}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium">
                          <span className={`${
                            day.commentPercentage > 5 ? 'text-green-600' : 
                            day.commentPercentage > 1 ? 'text-yellow-600' : 
                            day.commentPercentage > 0 ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {formatPercentage(day.commentPercentage)}
                          </span>
                        </td>
                        <td className="p-3 text-right text-gray-600">
                          {day.efficiency > 0 ? `$${Math.ceil(day.efficiency)}` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {day.commentPercentage > 5 ? '🟢' : 
                           day.commentPercentage > 1 ? '🟡' : 
                           day.commentPercentage > 0 ? '🔵' : '⚪'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Legend */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Performance Legend</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                <div className="flex items-center space-x-2">
                  <span>🟢</span>
                  <span>Excellent (&gt;5%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🟡</span>
                  <span>Good (1-5%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🔵</span>
                  <span>Low (0-1%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⚪</span>
                  <span>None (0%)</span>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-gray-600">
                  💡 <strong>Ad Spend per $1 Comment:</strong> Shows how much you spent in ads to generate $1 of comment revenue. Lower numbers are better (e.g., $2.50 means you spent $2.50 in ads for every $1 of comment revenue).
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Chart Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Comment Revenue & Percentage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis yAxisId="revenue" orientation="left" stroke="#2563eb" />
                <YAxis yAxisId="percentage" orientation="right" stroke="#dc2626" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Comment Revenue') return [formatCurrency(value), name];
                    if (name === 'Comment % of Ad Spend') return [formatPercentage(value), name];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Bar 
                  yAxisId="revenue" 
                  dataKey="commentRevenue" 
                  name="Comment Revenue" 
                  fill="#2563eb"
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="percentage"
                  type="monotone"
                  dataKey="commentRevenuePercentage"
                  name="Comment % of Ad Spend"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">Trend Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-600">Best Comment Revenue Day:</p>
                <p className="font-semibold">
                  {summaryMetrics.bestDay ? 
                    `${summaryMetrics.bestDay.displayDate} - ${formatCurrency(summaryMetrics.bestDay.commentRevenue)}` : 
                    'No comment revenue recorded'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Period Trend:</p>
                <p className={`font-semibold ${summaryMetrics.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summaryMetrics.trend >= 0 ? '↗' : '↘'} {formatCurrency(Math.abs(summaryMetrics.trend))}
                </p>
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-xs text-gray-500">
                📝 Note: Comment revenue tracking started June 1st, 2024. Blue bars show daily amounts, red line shows percentage of ad spend.
                {processedData.dailyData.length > 0 && (
                  <span className="block mt-1">
                    Last comment revenue data: {processedData.dailyData[processedData.dailyData.length - 1]?.displayDate}
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle>Comment Revenue by Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Network Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                                          <Pie
                        data={networkData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, commentRevenue }) => 
                          commentRevenue > 100 ? `${name}: ${(percent * 100).toFixed(1)}%` : ''
                        }
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="commentRevenue"
                      >
                      {networkData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Network Performance</h3>
              <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left">Network</th>
                          <th className="p-2 text-right">Comment Revenue</th>
                          <th className="p-2 text-right">Ad Spend</th>
                          <th className="p-2 text-right">Comment %</th>
                          <th className="p-2 text-right">Ad Spend per $1 Comment</th>
                          <th className="p-2 text-right">Entries</th>
                        </tr>
                      </thead>
                      <tbody>
                        {networkData.map((network, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2 font-medium">{network.name}</td>
                            <td className="p-2 text-right font-medium text-blue-600">{formatCurrency(network.commentRevenue)}</td>
                            <td className="p-2 text-right">{formatCurrency(network.adSpend)}</td>
                            <td className="p-2 text-right">{formatPercentage(network.percentage)}</td>
                            <td className="p-2 text-right text-gray-600">
                              {network.commentRevenue > 0 ? `$${Math.ceil(network.adSpend / network.commentRevenue)}` : '-'}
                            </td>
                            <td className="p-2 text-right">{network.entries}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offer Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle>Comment Revenue by Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Offer Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={offerData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, commentRevenue }) => 
                        commentRevenue > 100 ? `${name}: ${(percent * 100).toFixed(1)}%` : ''
                      }
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="commentRevenue"
                    >
                      {offerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Offer Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Offer</th>
                      <th className="p-2 text-right">Comment Revenue</th>
                      <th className="p-2 text-right">Ad Spend</th>
                      <th className="p-2 text-right">Comment %</th>
                      <th className="p-2 text-right">Ad Spend per $1 Comment</th>
                      <th className="p-2 text-right">Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offerData.map((offer, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 font-medium">{offer.name}</td>
                        <td className="p-2 text-right font-medium text-blue-600">{formatCurrency(offer.commentRevenue)}</td>
                        <td className="p-2 text-right">{formatCurrency(offer.adSpend)}</td>
                        <td className="p-2 text-right">{formatPercentage(offer.percentage)}</td>
                        <td className="p-2 text-right text-gray-600">
                          {offer.commentRevenue > 0 ? `$${Math.ceil(offer.adSpend / offer.commentRevenue)}` : '-'}
                        </td>
                        <td className="p-2 text-right">{offer.entries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Comment Revenue Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {dailyDetailsData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Comment Revenue Data</h3>
                <p className="text-gray-500 mb-4">
                  No comment revenue has been recorded for the selected period.
                </p>
                <div className="text-sm text-gray-400">
                  <p>• Comment revenue tracking started June 1st, 2024</p>
                  <p>• Try selecting a different time period</p>
                  <p>• Check if comment revenue data has been entered in the main sheet</p>
                </div>
              </div>
            ) : (
              dailyDetailsData.map((day, dayIndex) => (
                <div key={day.date} className="bg-white border rounded-lg p-4">
                                      <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium">{day.displayDate}</h4>
                      <div className="text-right grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Comment Revenue</p>
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(day.totalCommentRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Ad Spend</p>
                          <p className="text-xl font-bold text-gray-700">{formatCurrency(day.totalAdSpend)}</p>
                        </div>
                      </div>
                    </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left">Network</th>
                          <th className="p-2 text-left">Offer</th>
                          <th className="p-2 text-right">Comment Revenue</th>
                          <th className="p-2 text-right">Ad Spend</th>
                          <th className="p-2 text-right">% of Spend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.entries.map((entry, entryIndex) => (
                          <tr key={entryIndex} className="border-t">
                            <td className="p-2 font-medium">{entry.network}</td>
                            <td className="p-2">{entry.offer}</td>
                            <td className="p-2 text-right font-medium text-blue-600">
                              {formatCurrency(entry.commentRevenue)}
                            </td>
                            <td className="p-2 text-right">{formatCurrency(entry.adSpend)}</td>
                            <td className="p-2 text-right">
                              {entry.adSpend > 0 ? formatPercentage((entry.commentRevenue / entry.adSpend) * 100) : '0%'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  );
} 