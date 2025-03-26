import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Brain, Search, TrendingUp, DollarSign, FileText, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import _ from 'lodash';

// Helper function for currency formatting
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const calculateGrowthRate = (currentValue, previousValue) => {
  if (!previousValue || previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
};

const renderMetricCard = ({ label, value, type, trend = null, explanation = null }) => {
  const getValueColor = () => {
    if (type === 'currency') return 'text-gray-900';
    if (type === 'percentage') {
      if (label.toLowerCase().includes('volatility')) {
        return value > 50 ? 'text-orange-600' : 'text-green-600';
      }
      return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
    }
    return 'text-gray-900';
  };

  const formatValue = () => {
    if (type === 'currency') return formatCurrency(value);
    if (type === 'percentage') return `${value.toFixed(1)}%`;
    return value;
  };

  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-lg font-semibold ${getValueColor()}`}>
        {formatValue()}
      </p>
      {explanation && (
        <p className="text-xs text-gray-500 mt-1">{explanation}</p>
      )}
      {trend && (
        <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {trend.toFixed(1)}% vs previous period
        </div>
      )}
    </div>
  );
};

const renderPerformanceSection = (metrics, timeFrame, query) => {
  const focusMetric = metrics.focusMetric;
  const comparison = metrics.comparison;
  const sortBy = metrics.sortBy;
  const riskFactor = metrics.riskFactor;
  
  let sectionTitle = 'Performance Analysis';
  let description = `Analysis for the last ${timeFrame} days.`;
  
  if (focusMetric === 'top') {
    sectionTitle = `Top Offers by ${sortBy || 'Performance'}`;
    description = `Best performing offers based on ${sortBy?.toLowerCase() || 'overall metrics'}.`;
  } else if (focusMetric === 'mediaBuyers') {
    if (metrics.filter === '30day') {
      sectionTitle = 'Media Buyers - 30 Day Challenge';
      description = 'New media buyers performance in their first 30 days.';
    } else {
      sectionTitle = metrics.filter === 'top' ? 'Top Media Buyers' : 'Struggling Media Buyers';
      description = metrics.filter === 'top' ? 
        'Media buyers with best performance metrics.' :
        'Media buyers needing attention based on performance metrics.';
    }
  } else if (focusMetric === 'underperforming') {
    sectionTitle = 'Risk Analysis';
    description = riskFactor === 'volatility' ? 'Offers with high volatility risk' :
                 riskFactor === 'critical' ? 'Offers requiring immediate attention' :
                 'Underperforming offers needing optimization';
  } else if (focusMetric === 'profit') {
    sectionTitle = 'Profit Trend Analysis';
    description = 'Net profit analysis showing growth and trends.';
  } else if (focusMetric === 'opportunities') {
    sectionTitle = 'Scaling Opportunities';
    description = 'Top performing offers with growth potential.';
  } else if (focusMetric === 'risk') {
    sectionTitle = 'Risk Assessment';
    description = 'Offers with concerning metrics that need monitoring.';
  }

  if (comparison === 'month') {
    description += ' Comparing to previous month.';
  } else if (comparison === 'year') {
    description += ' Comparing to previous year.';
  }

  const sortedMetrics = [...metrics.metrics].sort((a, b) => {
    if (query.includes('worst') || query.includes('lowest')) {
      return a.roi - b.roi;
    }
    return b.roi - a.roi;
  });

  const isShowingWorst = query.toLowerCase().includes('worst') || query.toLowerCase().includes('lowest');
  const title = isShowingWorst ? 'Lowest Performing Offers' : 'Top Performing Offers';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          {sectionTitle}
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          {description} Metrics include revenue, spend, margin, ROI, and volatility.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Offer</th>
                <th className="text-right py-3 px-4">Revenue</th>
                <th className="text-right py-3 px-4">Spend</th>
                <th className="text-right py-3 px-4">Margin</th>
                <th className="text-right py-3 px-4">ROI</th>
                <th className="text-right py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    Volatility
                    <div className="group relative">
                      <span className="text-xs text-gray-500 cursor-help">(Daily Variation)</span>
                      <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        <p>Measures daily performance stability:</p>
                        <ul className="mt-1 space-y-1">
                          <li>• {'<'}30%: Stable</li>
                          <li>• 30-50%: Watch</li>
                          <li>• {'>'}50%: High Risk</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMetrics.map((metric, index) => (
                <tr 
                  key={metric.offer}
                  className={`
                    border-b last:border-0
                    ${index === 0 ? 'bg-blue-50' : index % 2 === 0 ? 'bg-gray-50' : ''}
                  `}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium">{metric.offer}</div>
                  </td>
                  <td className="text-right py-3 px-4 font-medium">
                    {formatCurrency(metric.revenue)}
                  </td>
                  <td className="text-right py-3 px-4 font-medium">
                    {formatCurrency(metric.spend)}
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={metric.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(metric.margin)}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`
                      px-2 py-1 rounded-full text-sm font-medium
                      ${metric.roi > 30 ? 'bg-green-100 text-green-800' : 
                        metric.roi > 15 ? 'bg-blue-100 text-blue-800' : 
                        'bg-orange-100 text-orange-800'}
                    `}>
                      {metric.roi.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`
                      font-medium
                      ${metric.volatility > 50 ? 'text-red-600' :
                        metric.volatility > 30 ? 'text-orange-600' :
                        'text-green-600'}
                    `}>
                      {metric.volatility.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium mb-2">Understanding the Metrics:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">ROI Colors:</p>
              <ul className="mt-1 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-100"></span>
                  Excellent ({'>'}30%)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-100"></span>
                  Good (15-30%)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-100"></span>
                  Moderate ({'<'}15%)
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Volatility Indicators:</p>
              <ul className="mt-1 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">●</span>
                  Stable ({'<'}30%)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-600">●</span>
                  Moderate (30-50%)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">●</span>
                  High ({'>'}50%)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const analyzeNetworkExposure = (data, days) => {
  if (!data || !Array.isArray(data)) {
    throw new Error('No performance data available');
  }

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const filteredData = data.filter(d => {
    const date = d.Date ? new Date(d.Date) : new Date(d.date);
    return date >= startDate && date <= now;
  });

  if (filteredData.length === 0) {
    throw new Error(`No data found for the last ${days} days`);
  }

  // Group by network
  const networkData = _.groupBy(filteredData, d => {
    const networkOffer = d.networkOffer || d['Network Offer'] || d['Network-Offer'];
    if (networkOffer) return networkOffer.split(' - ')[0];
    return d.Network || d.network || 'Unknown';
  });

  const totalRevenue = _.sumBy(filteredData, d => 
    parseFloat(d.revenue || d.Revenue || d['Total Revenue'] || 0)
  );

  const networkMetrics = Object.entries(networkData).map(([network, data]) => {
    const revenue = _.sumBy(data, d => 
      parseFloat(d.revenue || d.Revenue || d['Total Revenue'] || 0)
    );
    const spend = _.sumBy(data, d => 
      parseFloat(d.spend || d.Spend || d['Ad Spend'] || 0)
    );
    const margin = revenue - spend;
    
    // Calculate daily volatility
    const dailyRevenue = _.groupBy(data, d => {
      const date = d.Date ? new Date(d.Date) : new Date(d.date);
      return date.toISOString().split('T')[0];
    });
    
    const dailyTotals = Object.values(dailyRevenue).map(day => 
      _.sumBy(day, d => parseFloat(d.revenue || d.Revenue || d['Total Revenue'] || 0))
    );
    
    const mean = _.mean(dailyTotals);
    const volatility = mean ? (Math.sqrt(_.sum(dailyTotals.map(t => Math.pow(t - mean, 2))) / dailyTotals.length) / Math.abs(mean)) * 100 : 0;

    return {
      network,
      revenue,
      spend,
      margin,
      percentageOfRevenue: (revenue / totalRevenue) * 100,
      volatility,
      offerCount: new Set(data.map(d => {
        const networkOffer = d.networkOffer || d['Network Offer'] || d['Network-Offer'];
        if (networkOffer) return networkOffer.split(' - ')[1];
        return d.Offer || d.offer || 'Unknown';
      })).size
    };
  });

  // Sort by revenue percentage descending
  return {
    metrics: networkMetrics.sort((a, b) => b.percentageOfRevenue - a.percentageOfRevenue),
    timeFrame: days,
    totalRevenue
  };
};

const analyzeMediaBuyers = (data, days, is30DayChallenge = false) => {
  if (!data || !Array.isArray(data)) {
    throw new Error('No performance data available');
  }

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // For 30-day challenge, we want to identify new buyers in the last 60 days
  const lookbackDate = new Date(now);
  lookbackDate.setDate(lookbackDate.getDate() - (is30DayChallenge ? 60 : days));

  const filteredData = data.filter(d => {
    const date = d.Date ? new Date(d.Date) : new Date(d.date);
    return date >= (is30DayChallenge ? lookbackDate : startDate) && date <= now;
  });

  if (filteredData.length === 0) {
    throw new Error(`No data found for the specified time period`);
  }

  // Group by media buyer
  const groupedData = _.groupBy(filteredData, d => {
    return d.mediaBuyer || d['Media Buyer'] || d.buyer || 'Unknown';
  });

  // For 30-day challenge, identify new buyers
  const buyerFirstDates = {};
  if (is30DayChallenge) {
    Object.entries(groupedData).forEach(([buyer, data]) => {
      const dates = data.map(d => new Date(d.Date || d.date));
      buyerFirstDates[buyer] = new Date(Math.min(...dates));
    });
  }

  const buyerMetrics = Object.entries(groupedData).map(([buyer, data]) => {
    // For 30-day challenge, only include data from first 30 days
    let relevantData = data;
    if (is30DayChallenge) {
      const firstDate = buyerFirstDates[buyer];
      const thirtyDayEnd = new Date(firstDate);
      thirtyDayEnd.setDate(thirtyDayEnd.getDate() + 30);
      relevantData = data.filter(d => {
        const date = new Date(d.Date || d.date);
        return date >= firstDate && date <= thirtyDayEnd;
      });
    }

    const revenue = _.sumBy(relevantData, d => parseFloat(d.revenue || d.Revenue || d['Total Revenue'] || 0));
    const spend = _.sumBy(relevantData, d => parseFloat(d.spend || d.Spend || d['Ad Spend'] || 0));
    const margin = revenue - spend;
    const roi = spend ? (margin / spend) * 100 : 0;

    // Calculate daily margins for volatility
    const dailyMargins = _.groupBy(relevantData, d => {
      const date = d.Date ? new Date(d.Date) : new Date(d.date);
      return date.toISOString().split('T')[0];
    });

    const margins = Object.values(dailyMargins).map(day => {
      const dayRevenue = _.sumBy(day, d => parseFloat(d.revenue || d.Revenue || d['Total Revenue'] || 0));
      const daySpend = _.sumBy(day, d => parseFloat(d.spend || d.Spend || d['Ad Spend'] || 0));
      return dayRevenue - daySpend;
    });

    const mean = _.mean(margins);
    const volatility = mean ? (Math.sqrt(_.sum(margins.map(m => Math.pow(m - mean, 2))) / margins.length) / Math.abs(mean)) * 100 : 0;

    return {
      buyer,
      revenue,
      spend,
      margin,
      roi,
      volatility,
      startDate: is30DayChallenge ? buyerFirstDates[buyer] : null,
      daysActive: is30DayChallenge ? 
        Math.min(30, Math.ceil((now - buyerFirstDates[buyer]) / (1000 * 60 * 60 * 24))) : 
        days
    };
  }).filter(buyer => {
    if (is30DayChallenge) {
      // Only include buyers who started in the last 60 days
      const daysSinceStart = Math.ceil((now - buyer.startDate) / (1000 * 60 * 60 * 24));
      return daysSinceStart <= 60;
    }
    return buyer.buyer !== 'Unknown';
  });

  return {
    metrics: buyerMetrics,
    timeFrame: days,
    focusMetric: 'mediaBuyers',
    is30DayChallenge
  };
};

const renderMediaBuyerSection = (metrics, timeFrame, query) => {
  const isShowingStruggling = query.toLowerCase().includes('struggling') || 
                             query.toLowerCase().includes('worst') ||
                             query.toLowerCase().includes('underperforming');
  
  const sortedMetrics = [...metrics].sort((a, b) => {
    if (isShowingStruggling) {
      return a.roi - b.roi;
    }
    return b.roi - a.roi;
  });

  const title = isShowingStruggling ? 'Struggling Media Buyers' : 'Top Performing Media Buyers';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          {title}
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Analysis for the last {timeFrame} days. Metrics include revenue, margin, ROI, and active offers.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Media Buyer</th>
                <th className="text-right py-3 px-4">Active Offers</th>
                <th className="text-right py-3 px-4">Revenue</th>
                <th className="text-right py-3 px-4">Margin</th>
                <th className="text-right py-3 px-4">ROI</th>
                <th className="text-right py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    Volatility
                    <div className="group relative">
                      <span className="text-xs text-gray-500 cursor-help">(Daily Variation)</span>
                      <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        <p>Measures daily performance stability:</p>
                        <ul className="mt-1 space-y-1">
                          <li>• {'<'}30%: Stable</li>
                          <li>• 30-50%: Watch</li>
                          <li>• {'>'}50%: High Risk</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMetrics.map((metric, index) => (
                <tr 
                  key={metric.buyer}
                  className={`
                    border-b last:border-0
                    ${index === 0 ? 'bg-blue-50' : index % 2 === 0 ? 'bg-gray-50' : ''}
                  `}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium">{metric.buyer}</div>
                  </td>
                  <td className="text-right py-3 px-4">
                    {metric.offerCount}
                  </td>
                  <td className="text-right py-3 px-4 font-medium">
                    {formatCurrency(metric.revenue)}
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={metric.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(metric.margin)}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`
                      px-2 py-1 rounded-full text-sm font-medium
                      ${metric.roi > 30 ? 'bg-green-100 text-green-800' : 
                        metric.roi > 15 ? 'bg-blue-100 text-blue-800' : 
                        'bg-orange-100 text-orange-800'}
                    `}>
                      {metric.roi.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`
                      font-medium
                      ${metric.volatility > 50 ? 'text-red-600' :
                        metric.volatility > 30 ? 'text-orange-600' :
                        'text-green-600'}
                    `}>
                      {metric.volatility.toFixed(1)}%
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

const analyzeNetworkCaps = (data, days) => {
  if (!data || !Array.isArray(data)) {
    throw new Error('No performance data available');
  }

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Get the most recent data for daily revenue calculation
  const recentData = data.filter(d => {
    const date = d.Date ? new Date(d.Date) : new Date(d.date);
    return date >= startDate && date <= now;
  });

  if (recentData.length === 0) {
    throw new Error(`No data found for the last ${days} days`);
  }

  // Group by network and calculate daily averages
  const networkData = _.groupBy(recentData, d => {
    const networkOffer = d.networkOffer || d['Network Offer'] || d['Network-Offer'];
    if (networkOffer) return networkOffer.split(' - ')[0];
    return d.Network || d.network || 'Unknown';
  });

  // Define network caps (you should replace these with actual caps from your data)
  const networkCaps = {
    'ACA': 100000,
    'Suited': 75000,
    'RevContent': 50000,
    'Taboola': 150000,
    'Outbrain': 125000,
    // Add more networks and their caps as needed
  };

  const networkMetrics = Object.entries(networkData).map(([network, data]) => {
    // Calculate daily revenues
    const dailyRevenues = _.groupBy(data, d => {
      const date = d.Date ? new Date(d.Date) : new Date(d.date);
      return date.toISOString().split('T')[0];
    });

    const dailyTotals = Object.values(dailyRevenues).map(day => 
      _.sumBy(day, d => parseFloat(d.revenue || d.Revenue || d['Total Revenue'] || 0))
    );

    const avgDailyRevenue = _.mean(dailyTotals);
    const maxDailyRevenue = _.max(dailyTotals);
    const cap = networkCaps[network] || 100000; // Default cap if not specified
    const percentOfCap = (maxDailyRevenue / cap) * 100;
    const daysToHitCap = avgDailyRevenue > 0 ? Math.floor((cap - maxDailyRevenue) / avgDailyRevenue) : Infinity;

    return {
      network,
      avgDailyRevenue,
      maxDailyRevenue,
      cap,
      percentOfCap,
      daysToHitCap,
      trend: calculateGrowthRate(
        _.mean(dailyTotals.slice(-7)),
        _.mean(dailyTotals.slice(-14, -7))
      )
    };
  });

  // Sort by percentage of cap descending
  return {
    metrics: networkMetrics.sort((a, b) => b.percentOfCap - a.percentOfCap),
    timeFrame: days
  };
};

const renderNetworkCaps = (capData) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        Network Cap Analysis
      </CardTitle>
      <p className="text-sm text-gray-500 mt-1">
        Daily revenue vs. network caps over the last {capData.timeFrame} days.
      </p>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Network</th>
              <th className="text-right py-3 px-4">Daily Cap</th>
              <th className="text-right py-3 px-4">Max Daily Rev</th>
              <th className="text-right py-3 px-4">Avg Daily Rev</th>
              <th className="text-right py-3 px-4">% of Cap</th>
              <th className="text-right py-3 px-4">7-Day Trend</th>
            </tr>
          </thead>
          <tbody>
            {capData.metrics.map((network, index) => (
              <tr 
                key={network.network}
                className={`
                  border-b last:border-0
                  ${network.percentOfCap > 90 ? 'bg-red-50' :
                    network.percentOfCap > 75 ? 'bg-orange-50' :
                    index % 2 === 0 ? 'bg-gray-50' : ''}
                `}
              >
                <td className="py-3 px-4">
                  <div className="font-medium">{network.network}</div>
                </td>
                <td className="text-right py-3 px-4 font-medium">
                  {formatCurrency(network.cap)}
                </td>
                <td className="text-right py-3 px-4">
                  {formatCurrency(network.maxDailyRevenue)}
                </td>
                <td className="text-right py-3 px-4">
                  {formatCurrency(network.avgDailyRevenue)}
                </td>
                <td className="text-right py-3 px-4">
                  <span className={`
                    px-2 py-1 rounded-full text-sm font-medium
                    ${network.percentOfCap > 90 ? 'bg-red-100 text-red-800' :
                      network.percentOfCap > 75 ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'}
                  `}>
                    {network.percentOfCap.toFixed(1)}%
                  </span>
                </td>
                <td className="text-right py-3 px-4">
                  <span className={`
                    font-medium
                    ${network.trend > 0 ? 'text-green-600' : 'text-red-600'}
                  `}>
                    {network.trend > 0 ? '+' : ''}{network.trend.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-medium mb-2">Cap Status Guide:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-100"></span>
            <span>Critical ({'>'}90% of cap) - Immediate action required</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-100"></span>
            <span>Warning (75-90%) - Monitor closely</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-100"></span>
            <span>Safe ({'<'}75%) - Room for scaling</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const render30DayChallenge = (metrics, timeFrame) => {
  const sortedBuyers = [...metrics].sort((a, b) => b.roi - a.roi);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          30 Day Challenge - Media Buyer Progress
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Performance tracking for media buyers in their first 30 days. Commission structure: $0-$100k (15%), $100k-$250k (20%), $250k+ (30%)
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Media Buyer</th>
                <th className="text-right py-3 px-4">Days Active</th>
                <th className="text-right py-3 px-4">Revenue</th>
                <th className="text-right py-3 px-4">Spend</th>
                <th className="text-right py-3 px-4">Margin</th>
                <th className="text-right py-3 px-4">ROI</th>
                <th className="text-right py-3 px-4">Commission Rate</th>
                <th className="text-right py-3 px-4">Est. Commission</th>
              </tr>
            </thead>
            <tbody>
              {sortedBuyers.map((buyer, index) => {
                const commissionRate = buyer.margin > 250000 ? 30 :
                                     buyer.margin > 100000 ? 20 : 15;
                const commission = (buyer.margin * (commissionRate / 100));
                
                return (
                  <tr 
                    key={buyer.buyer}
                    className={`
                      border-b last:border-0
                      ${index === 0 ? 'bg-blue-50' : index % 2 === 0 ? 'bg-gray-50' : ''}
                    `}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium">{buyer.buyer}</div>
                      <div className="text-xs text-gray-500">
                        Started {new Date(buyer.startDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="font-medium">{buyer.daysActive}</div>
                      <div className="text-xs text-gray-500">
                        {30 - buyer.daysActive} days remaining
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {formatCurrency(buyer.revenue)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {formatCurrency(buyer.spend)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={buyer.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(buyer.margin)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`
                        px-2 py-1 rounded-full text-sm font-medium
                        ${buyer.roi > 30 ? 'bg-green-100 text-green-800' : 
                          buyer.roi > 15 ? 'bg-blue-100 text-blue-800' : 
                          'bg-orange-100 text-orange-800'}
                      `}>
                        {buyer.roi.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="font-medium">{commissionRate}%</span>
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {formatCurrency(commission)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium mb-2">30 Day Challenge Rules:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-100"></span>
              <span>First 30 days performance-based compensation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-100"></span>
              <span>Commission tiers based on total margin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-100"></span>
              <span>Full-time commitment required</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AIInsightsPage = ({ performanceData, invoicesData, expenseData }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  // Debug log the incoming data
  React.useEffect(() => {
    console.log('Performance Data Sample:', performanceData?.slice(0, 2));
    console.log('Performance Data Length:', performanceData?.length);
    console.log('Sample Data Fields:', performanceData?.[0] ? Object.keys(performanceData[0]) : 'No data');
  }, [performanceData]);

  const parseTimeFrame = (question) => {
    const timeFrames = {
      'last week': 7,
      'last month': 30,
      'last 7 days': 7,
      'last 30 days': 30,
      'this month': new Date().getDate(),
      'this week': 7,
    };

    for (const [phrase, days] of Object.entries(timeFrames)) {
      if (question.toLowerCase().includes(phrase)) {
        return days;
      }
    }
    return 30; // Default to 30 days if no time frame specified
  };

  const analyzePerformance = (data, days) => {
    if (!data || !Array.isArray(data)) {
      throw new Error('No performance data available');
    }

    console.log('Raw performance data sample:', {
      first: data[0],
      fields: Object.keys(data[0]),
      possibleNetworkFields: {
        networkOffer: data[0].networkOffer,
        'Network Offer': data[0]['Network Offer'],
        'Network-Offer': data[0]['Network-Offer'],
        Network: data[0].Network,
        Offer: data[0].Offer
      }
    });

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const filteredData = data.filter(d => {
      // Handle both date string formats
      const date = d.Date ? new Date(d.Date) : new Date(d.date);
      return date >= startDate && date <= now;
    });

    console.log('Filtered data count:', filteredData.length);

    if (filteredData.length === 0) {
      throw new Error(`No data found for the last ${days} days. Please try a different time period.`);
    }

    // Group data by network-offer, trying different possible field combinations
    const groupedData = _.groupBy(filteredData, d => {
      // Try all possible field combinations
      const networkOffer = d.networkOffer || d['Network Offer'] || d['Network-Offer'];
      if (networkOffer) return networkOffer;
      
      // If no combined field exists, try to combine Network and Offer fields
      const network = d.Network || d.network;
      const offer = d.Offer || d.offer;
      if (network && offer) return `${network} - ${offer}`;
      
      // Fallback to prevent undefined
      return 'Unknown';
    });
    
    console.log('Grouped data keys:', Object.keys(groupedData));

    // Combine "Suited - ACA" with "ACA - ACA"
    if (groupedData['Suited - ACA']) {
      if (!groupedData['ACA - ACA']) {
        groupedData['ACA - ACA'] = [];
      }
      groupedData['ACA - ACA'] = [...groupedData['ACA - ACA'], ...groupedData['Suited - ACA']];
      delete groupedData['Suited - ACA'];
    }

    const performanceMetrics = Object.entries(groupedData).map(([offer, data]) => {
      const totalRevenue = _.sumBy(data, d => parseFloat(d.revenue || d.Revenue || d['Total Revenue'] || 0));
      const totalSpend = _.sumBy(data, d => parseFloat(d.spend || d.Spend || d['Ad Spend'] || 0));
      const totalMargin = totalRevenue - totalSpend;
      const roi = totalSpend ? (totalMargin / totalSpend) * 100 : 0;

      // Calculate daily margins for volatility
      const dailyMargins = _.groupBy(data, d => {
        const date = d.Date ? new Date(d.Date) : new Date(d.date);
        return date.toISOString().split('T')[0];
      });

      const margins = Object.values(dailyMargins).map(day => {
        const dayRevenue = _.sumBy(day, d => parseFloat(d.revenue || d.Revenue || d['Total Revenue'] || 0));
        const daySpend = _.sumBy(day, d => parseFloat(d.spend || d.Spend || d['Ad Spend'] || 0));
        return dayRevenue - daySpend;
      });
      
      const mean = _.mean(margins);
      const volatility = mean ? (Math.sqrt(_.sum(margins.map(m => Math.pow(m - mean, 2))) / margins.length) / Math.abs(mean)) * 100 : 0;

      return {
        offer: offer === 'Unknown' ? 'All Networks' : offer,
        revenue: totalRevenue,
        spend: totalSpend,
        margin: totalMargin,
        roi,
        volatility,
        dailyVolume: data.length / days
      };
    });

    return {
      metrics: performanceMetrics,
      timeFrame: days
    };
  };

  const analyzeExpenses = (data, days) => {
    if (!data || !Array.isArray(data)) {
      throw new Error('No expense data available');
    }

    const filteredData = data.filter(d => {
      const date = new Date(d.date);
      const now = new Date();
      return (now - date) <= days * 24 * 60 * 60 * 1000;
    });

    const totalExpenses = _.sumBy(filteredData, 'amount');
    const expensesByCategory = _.groupBy(filteredData, 'category');
    const categoryBreakdown = Object.entries(expensesByCategory).map(([category, items]) => ({
      category,
      amount: _.sumBy(items, 'amount'),
      percentage: (_.sumBy(items, 'amount') / totalExpenses) * 100
    }));

    return {
      total: totalExpenses,
      breakdown: categoryBreakdown,
      timeFrame: days
    };
  };

  const analyzeInvoices = (data, days) => {
    if (!data || !Array.isArray(data)) {
      throw new Error('No invoice data available');
    }

    const filteredData = data.filter(d => {
      const date = new Date(d.dueDate);
      const now = new Date();
      return (now - date) <= days * 24 * 60 * 60 * 1000;
    });

    const overdue = filteredData.filter(inv => 
      new Date(inv.dueDate) < new Date() && inv.status !== 'paid'
    );

    const upcoming = filteredData.filter(inv => 
      new Date(inv.dueDate) >= new Date() && inv.status !== 'paid'
    );

    return {
      overdue: {
        count: overdue.length,
        total: _.sumBy(overdue, 'amount')
      },
      upcoming: {
        count: upcoming.length,
        total: _.sumBy(upcoming, 'amount')
      },
      timeFrame: days
    };
  };

  const generateInsights = useCallback(async (questionText) => {
    const queryToAnalyze = questionText || query;
    
    if (!queryToAnalyze.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const days = parseTimeFrame(queryToAnalyze);
      const lowerQuery = queryToAnalyze.toLowerCase();
      let response = {};

      // Network Cap Analysis
      if (lowerQuery.includes('cap') || lowerQuery.includes('limit')) {
        response.networkCaps = analyzeNetworkCaps(performanceData, days);
      }
      // Media Buyer Analysis
      else if (lowerQuery.includes('media buyer') || lowerQuery.includes('buyer')) {
        const is30DayChallenge = lowerQuery.includes('30 day challenge');
        response.mediaBuyers = analyzeMediaBuyers(performanceData, days, is30DayChallenge);
        if (!is30DayChallenge) {
          response.mediaBuyers.filter = lowerQuery.includes('struggling') || 
                                      lowerQuery.includes('worst') ? 'bottom' : 'top';
        } else {
          response.mediaBuyers.filter = '30day';
        }
      }
      // Performance and Growth Analysis
      else if (lowerQuery.includes('net profit') || lowerQuery.includes('profit increasing')) {
        response.performance = analyzePerformance(performanceData, days);
        response.performance.focusMetric = 'profit';
        response.performance.comparison = true;
      } 
      else if (lowerQuery.includes('vs last month') || lowerQuery.includes('compared to last month')) {
        response.performance = analyzePerformance(performanceData, 30);
        response.performance.focusMetric = 'trend';
        response.performance.comparison = 'month';
      }
      else if (lowerQuery.includes('last year') || lowerQuery.includes('year over year')) {
        response.performance = analyzePerformance(performanceData, 365);
        response.performance.focusMetric = 'trend';
        response.performance.comparison = 'year';
      }
      else if (lowerQuery.includes('month-over-month') || lowerQuery.includes('monthly trend')) {
        response.performance = analyzePerformance(performanceData, 90);
        response.performance.focusMetric = 'trend';
        response.performance.comparison = 'month';
      }
      else if (lowerQuery.includes('scale') || lowerQuery.includes('best performing')) {
        response.performance = analyzePerformance(performanceData, days);
        response.performance.focusMetric = 'opportunities';
        response.performance.filter = 'top';
      }
      // Risk and Optimization Analysis
      else if (lowerQuery.includes('risky') || lowerQuery.includes('risk')) {
        response.networkExposure = analyzeNetworkExposure(performanceData, days);
        response.performance = analyzePerformance(performanceData, days);
        response.performance.focusMetric = 'risk';
      }
      else if (lowerQuery.includes('pause') || lowerQuery.includes('shut off') || 
               lowerQuery.includes('underperforming')) {
        response.performance = analyzePerformance(performanceData, days);
        response.performance.focusMetric = 'underperforming';
        response.performance.filter = 'bottom';
      }
      else if (lowerQuery.includes('optimization')) {
        response.performance = analyzePerformance(performanceData, days);
        response.networkExposure = analyzeNetworkExposure(performanceData, days);
        response.performance.focusMetric = 'optimization';
      }
      // Financial Health Analysis
      else if (lowerQuery.includes('cash position') || lowerQuery.includes('cash flow')) {
        response.invoices = analyzeInvoices(invoicesData, days);
        response.expenses = analyzeExpenses(expenseData, days);
        response.focusMetric = 'cashPosition';
      }
      else if (lowerQuery.includes('payment risk') || lowerQuery.includes('outstanding payment')) {
        response.invoices = analyzeInvoices(invoicesData, days);
        response.focusMetric = 'paymentRisk';
      }
      else if (lowerQuery.includes('network payment') || lowerQuery.includes('network status')) {
        response.invoices = analyzeInvoices(invoicesData, days);
        response.networkExposure = analyzeNetworkExposure(performanceData, days);
        response.focusMetric = 'networkStatus';
      }
      else if (lowerQuery.includes('large expense') || lowerQuery.includes('upcoming expense')) {
        response.expenses = analyzeExpenses(expenseData, days);
        response.focusMetric = 'largeExpenses';
      }
      else if (lowerQuery.includes('alert') || lowerQuery.includes('critical')) {
        response.performance = analyzePerformance(performanceData, days);
        response.invoices = analyzeInvoices(invoicesData, days);
        response.networkExposure = analyzeNetworkExposure(performanceData, days);
        response.focusMetric = 'alerts';
      }
      // Default Performance Analysis
      else if (lowerQuery.includes('performance') || lowerQuery.includes('offer') || 
               lowerQuery.includes('roi') || lowerQuery.includes('revenue')) {
        response.performance = analyzePerformance(performanceData, days);
      }

      if (Object.keys(response).length === 0) {
        throw new Error('I can help you analyze performance, network exposure, expenses, or invoices. Try asking about one of these topics!');
      }

      // Add context to the response based on the query type
      if (response.performance?.focusMetric === 'underperforming') {
        const metrics = response.performance.metrics;
        response.performance.metrics = metrics
          .filter(m => m.roi < 15 || m.volatility > 50)
          .sort((a, b) => a.roi - b.roi);
      }

      setInsights(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, performanceData, invoicesData, expenseData]);

  const renderNetworkExposure = (exposure) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Network Exposure Analysis
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Revenue concentration and risk analysis across networks for the last {exposure.timeFrame} days.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Network</th>
                <th className="text-right py-3 px-4">Active Offers</th>
                <th className="text-right py-3 px-4">Revenue</th>
                <th className="text-right py-3 px-4">Margin</th>
                <th className="text-right py-3 px-4">% of Revenue</th>
                <th className="text-right py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    Volatility
                    <div className="group relative">
                      <span className="text-xs text-gray-500 cursor-help">(Daily Variation)</span>
                      <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        <p>Measures daily performance stability:</p>
                        <ul className="mt-1 space-y-1">
                          <li>• {'<'}30%: Stable</li>
                          <li>• 30-50%: Watch</li>
                          <li>• {'>'}50%: High Risk</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {exposure.metrics.map((network, index) => (
                <tr 
                  key={network.network}
                  className={`
                    border-b last:border-0
                    ${network.percentageOfRevenue > 40 ? 'bg-red-50' :
                      network.percentageOfRevenue > 25 ? 'bg-orange-50' :
                      index % 2 === 0 ? 'bg-gray-50' : ''}
                  `}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium">{network.network}</div>
                  </td>
                  <td className="text-right py-3 px-4">
                    {network.offerCount}
                  </td>
                  <td className="text-right py-3 px-4 font-medium">
                    {formatCurrency(network.revenue)}
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={network.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(network.margin)}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`
                      px-2 py-1 rounded-full text-sm font-medium
                      ${network.percentageOfRevenue > 40 ? 'bg-red-100 text-red-800' :
                        network.percentageOfRevenue > 25 ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'}
                    `}>
                      {network.percentageOfRevenue.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={`
                      font-medium
                      ${network.volatility > 50 ? 'text-red-600' :
                        network.volatility > 30 ? 'text-orange-600' :
                        'text-green-600'}
                    `}>
                      {network.volatility.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium mb-2">Risk Assessment Guide:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-100"></span>
              <span>High Concentration ({'>'}40% of revenue) - Consider diversification</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-100"></span>
              <span>Moderate Concentration (25-40%) - Monitor closely</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-100"></span>
              <span>Healthy Distribution ({'<'}25%) - Well diversified</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderInsights = () => {
    if (!insights) return null;

    return (
      <div className="space-y-6">
        {insights.networkExposure && renderNetworkExposure(insights.networkExposure)}
        {insights.performance && renderPerformanceSection(
          insights.performance,
          insights.performance.timeFrame,
          query
        )}

        {insights.expenses && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Expense Analysis
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Breakdown of expenses by category for the selected period.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold mb-4">
                Total Expenses: {formatCurrency(insights.expenses.total)}
              </p>
              <div className="space-y-2">
                {insights.expenses.breakdown.map(category => (
                  <div 
                    key={category.category} 
                    className={`
                      flex justify-between items-center p-2 rounded
                      ${category.percentage > 30 ? 'bg-red-50' :
                        category.percentage > 20 ? 'bg-orange-50' :
                        category.percentage > 10 ? 'bg-yellow-50' : ''}
                    `}
                  >
                    <span className="font-medium">{category.category}</span>
                    <div className="text-right">
                      <span className="font-medium block">
                        {formatCurrency(category.amount)}
                      </span>
                      <span className={`text-sm ${
                        category.percentage > 30 ? 'text-red-600' :
                        category.percentage > 20 ? 'text-orange-600' :
                        'text-gray-500'
                      }`}>
                        {category.percentage.toFixed(1)}% of total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {insights.invoices && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Invoice Status
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Overview of overdue and upcoming invoice payments.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Overdue Invoices</h4>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(insights.invoices.overdue.total)}
                    </p>
                    <p className="text-sm text-red-600">
                      {insights.invoices.overdue.count} invoice{insights.invoices.overdue.count !== 1 ? 's' : ''} pending
                    </p>
                  </div>
                  <p className="text-xs text-red-700 mt-2">
                    Immediate attention required for overdue payments
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Upcoming Payments</h4>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(insights.invoices.upcoming.total)}
                    </p>
                    <p className="text-sm text-yellow-600">
                      {insights.invoices.upcoming.count} invoice{insights.invoices.upcoming.count !== 1 ? 's' : ''} due soon
                    </p>
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    Plan ahead for these upcoming payments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {insights.mediaBuyers && renderMediaBuyerSection(
          insights.mediaBuyers.metrics,
          insights.mediaBuyers.timeFrame,
          query
        )}

        {insights.networkCaps && renderNetworkCaps(insights.networkCaps)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Ask about performance, expenses, invoices, or trends..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && generateInsights(query)}
                className="border-gray-200"
              />
            </div>
            <Button
              onClick={() => generateInsights(query)}
              disabled={loading}
              className="bg-[#FF0000] hover:bg-[#cc0000] text-white"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600">Try asking about:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Top Performers</p>
                <div className="space-y-1">
                  {[
                    "Show top offers from last week",
                    "Best media buyers this month",
                    "Top performing offers last 30 days",
                    "Show highest ROI offers MTD",
                    "Best media buyers by margin",
                    "Show media buyers 30 day challenge"
                  ].map((example, i) => (
                    <button
                      key={i}
                      className="block text-sm text-[#FF0000] hover:text-[#cc0000] hover:underline text-left"
                      onClick={async () => {
                        setQuery(example);
                        await generateInsights(example);
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Underperforming</p>
                <div className="space-y-1">
                  {[
                    "Show struggling media buyers",
                    "Worst performing offers this week",
                    "Offers below 15% ROI",
                    "High volatility offers",
                    "Negative margin offers"
                  ].map((example, i) => (
                    <button
                      key={i}
                      className="block text-sm text-[#FF0000] hover:text-[#cc0000] hover:underline text-left"
                      onClick={async () => {
                        setQuery(example);
                        await generateInsights(example);
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Network Analysis</p>
                <div className="space-y-1">
                  {[
                    "Show network exposure risk",
                    "Network revenue breakdown",
                    "Networks hitting their caps",
                    "Network performance trend",
                    "Network payment status"
                  ].map((example, i) => (
                    <button
                      key={i}
                      className="block text-sm text-[#FF0000] hover:text-[#cc0000] hover:underline text-left"
                      onClick={async () => {
                        setQuery(example);
                        await generateInsights(example);
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Simple metrics key */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end">
              <div className="text-xs text-gray-500 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>ROI {'>'}30% | Volatility {'<'}30%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>ROI 15-30% | Volatility 30-50%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span>ROI {'<'}15% | Volatility {'>'}50%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Negative ROI | High Risk</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {insights?.mediaBuyers?.is30DayChallenge ? 
        render30DayChallenge(insights.mediaBuyers.metrics, insights.mediaBuyers.timeFrame) :
        renderInsights()
      }
    </div>
  );
};

export default AIInsightsPage; 