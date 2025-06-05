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

// Media Buyer Analysis Component - Dynamic time period analysis for media buyer performance
const MediaBuyerAnalysis = ({ performanceData = [], commissions = [] }) => {
  const [expandedBuyers, setExpandedBuyers] = useState(new Set());
  const [selectedPeriod, setSelectedPeriod] = useState(7); // Default to 7 days

  // Helper function to check if a media buyer is active
  const isActiveBuyer = (buyerName) => {
    if (!commissions.length) return true; // If no commission data, show all
    const commissionEntry = commissions.find(c => 
      c['Media Buyer'] === buyerName || c.mediaBuyer === buyerName
    );
    return commissionEntry?.Status === 'ACTIVE' || commissionEntry?.status === 'ACTIVE';
  };

  const toggleBuyerExpansion = (buyerName) => {
    const newExpanded = new Set(expandedBuyers);
    if (newExpanded.has(buyerName)) {
      newExpanded.delete(buyerName);
    } else {
      newExpanded.add(buyerName);
    }
    setExpandedBuyers(newExpanded);
  };

  // Time period options
  const periodOptions = [
    { value: 7, label: '7 Days' },
    { value: 14, label: '14 Days' },
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' }
  ];

  // Process data for the selected time period
  const challengeData = performanceData.reduce((acc, entry) => {
    const buyer = entry['Media Buyer'];
    // Filter out inactive media buyers and unknown
    if (!buyer || 
        buyer.toLowerCase() === 'unknown' || 
        !isActiveBuyer(buyer)) return acc;

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
        dailyData: [],
        offerBreakdown: new Map()
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

    // Add daily data for trend analysis
    buyerData.dailyData.push({
      date: entry.Date,
      spend,
      revenue,
      margin,
      roi: spend > 0 ? (margin / spend) * 100 : 0
    });

    // Track offer performance with normalized keys to prevent duplicates
    const network = (entry.Network || 'Unknown').trim();
    const offer = (entry.Offer || 'Unknown').trim();
    const networkOffer = `${network} - ${offer}`;
    
    if (!buyerData.offerBreakdown.has(networkOffer)) {
      buyerData.offerBreakdown.set(networkOffer, {
        network,
        offer,
        spend: 0,
        revenue: 0,
        margin: 0,
        roi: 0,
        days: new Set()
      });
    }
    
    const offerData = buyerData.offerBreakdown.get(networkOffer);
    offerData.spend += spend;
    offerData.revenue += revenue;
    offerData.margin += margin;
    offerData.roi = offerData.spend > 0 ? (offerData.margin / offerData.spend) * 100 : 0;
    offerData.days.add(entry.Date);

    return acc;
  }, []);

  // Calculate the date range based on selected period
  const today = new Date();
  const selectedDaysAgo = new Date();
  selectedDaysAgo.setDate(today.getDate() - selectedPeriod);

  // Process each buyer's data for the selected time period
  const filteredData = challengeData
    .map(buyer => {
      // Filter daily data to only include the selected time period
      const filteredDailyData = buyer.dailyData.filter(day => 
        new Date(day.date) >= selectedDaysAgo
      );

      // Recalculate totals based on filtered daily data
      const totals = filteredDailyData.reduce((acc, day) => ({
        spend: acc.spend + day.spend,
        revenue: acc.revenue + day.revenue,
        margin: acc.margin + day.margin
      }), { spend: 0, revenue: 0, margin: 0 });

      // Process offer breakdown for the selected period - rebuild from filtered data
      const periodOfferBreakdown = new Map();
      
      // Filter performance data for this buyer and time period
      performanceData
        .filter(entry => {
          const entryDate = new Date(entry.Date);
          return entry['Media Buyer'] === buyer.name && 
                 entryDate >= selectedDaysAgo &&
                 entryDate <= today;
        })
        .forEach(entry => {
          const network = (entry.Network || 'Unknown').trim();
          const offer = (entry.Offer || 'Unknown').trim();
          const networkOffer = `${network} - ${offer}`;
          
          if (!periodOfferBreakdown.has(networkOffer)) {
            periodOfferBreakdown.set(networkOffer, {
              network,
              offer,
              spend: 0,
              revenue: 0,
              margin: 0,
              roi: 0,
              days: new Set()
            });
          }
          
          const offerData = periodOfferBreakdown.get(networkOffer);
          const spend = parseFloat(entry['Ad Spend'] || 0);
          const revenue = parseFloat(entry['Total Revenue'] || 0);
          
          offerData.spend += spend;
          offerData.revenue += revenue;
          offerData.margin += (revenue - spend);
          offerData.roi = offerData.spend > 0 ? (offerData.margin / offerData.spend) * 100 : 0;
          offerData.days.add(entry.Date);
        });

      const offerBreakdownArray = Array.from(periodOfferBreakdown.entries())
        .map(([networkOffer, data]) => ({
          networkOffer,
          ...data,
          days: data.days.size,
          spendPercentage: totals.spend > 0 ? (data.spend / totals.spend) * 100 : 0
        }))
        .filter(offer => offer.spend > 0)
        .sort((a, b) => b.margin - a.margin);

      return {
        ...buyer,
        spend: totals.spend,
        revenue: totals.revenue,
        margin: totals.margin,
        roi: totals.spend > 0 ? (totals.margin / totals.spend) * 100 : 0,
        dailyData: filteredDailyData,
        offerBreakdown: offerBreakdownArray
      };
    })
    // Filter out buyers with $0 spend
    .filter(buyer => buyer.spend > 0);

  // Sort by most recent start date
  filteredData.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  // Add scaling analysis
  const scalingAnalysis = filteredData.map(buyer => {
    // Calculate consistency score (lower variance = more consistent)
    const dailyROIs = buyer.dailyData.map(d => d.roi).filter(roi => !isNaN(roi));
    const avgROI = dailyROIs.reduce((sum, roi) => sum + roi, 0) / dailyROIs.length || 0;
    const variance = dailyROIs.reduce((sum, roi) => sum + Math.pow(roi - avgROI, 2), 0) / dailyROIs.length || 0;
    const consistencyScore = Math.max(0, 100 - Math.sqrt(variance)); // 0-100 scale

    // Calculate spend velocity (daily average spend) - use actual calendar days, not just days with data
    const spendVelocity = buyer.spend / selectedPeriod;
    
    // Portfolio diversification (number of profitable campaigns)
    const profitableCampaigns = buyer.offerBreakdown.filter(offer => offer.margin > 0).length;
    const totalCampaigns = buyer.offerBreakdown.length;
    const diversificationScore = totalCampaigns > 0 ? (profitableCampaigns / totalCampaigns) * 100 : 0;

    // Recent trend - adapt comparison period based on selected period
    const sortedData = buyer.dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));
    const comparisonDays = Math.max(3, Math.floor(selectedPeriod / 4)); // Use 1/4 of selected period, minimum 3 days
    const lastDays = sortedData.slice(-comparisonDays);
    const previousDays = sortedData.slice(-(comparisonDays * 2), -comparisonDays);
    
    const recentAvgROI = lastDays.length > 0 ? lastDays.reduce((sum, d) => sum + d.roi, 0) / lastDays.length : 0;
    const previousAvgROI = previousDays.length > 0 ? previousDays.reduce((sum, d) => sum + d.roi, 0) / previousDays.length : 0;
    const trendDirection = recentAvgROI > previousAvgROI ? 'improving' : recentAvgROI < previousAvgROI ? 'declining' : 'stable';

    // Scaling recommendation logic
    let scalingRecommendation = '';
    let scalingColor = '';
    let priority = 0;

    // Calculate days active for this buyer in the selected period
    const daysActive = buyer.dailyData.length;
    const isTestingPhase = daysActive < 5 || buyer.spend < 500;

    if (isTestingPhase) {
      scalingRecommendation = '🧪 TESTING PHASE';
      scalingColor = 'text-purple-700 bg-purple-100 font-semibold';
      priority = 6; // Highest priority for visibility
    } else if (buyer.roi > 15 && consistencyScore > 50 && trendDirection !== 'declining') {
      scalingRecommendation = '🚀 SCALE UP AGGRESSIVELY';
      scalingColor = 'text-green-700 bg-green-100 font-bold';
      priority = 5;
    } else if (buyer.roi > 10 && (consistencyScore > 30 || trendDirection === 'improving')) {
      scalingRecommendation = '📈 SCALE UP CAUTIOUSLY';
      scalingColor = 'text-green-600 bg-green-50 font-semibold';
      priority = 4;
    } else if (buyer.roi > 3 && buyer.roi <= 10) {
      scalingRecommendation = '⚖️ MAINTAIN & OPTIMIZE';
      scalingColor = 'text-blue-600 bg-blue-50';
      priority = 3;
    } else if (buyer.roi <= 3 && buyer.roi > -5) {
      scalingRecommendation = '⚠️ REDUCE SPEND - OPTIMIZE';
      scalingColor = 'text-yellow-700 bg-yellow-100 font-semibold';
      priority = 2;
    } else {
      scalingRecommendation = '🛑 SCALE BACK IMMEDIATELY';
      scalingColor = 'text-red-700 bg-red-100 font-bold';
      priority = 1;
    }

    // Simplified display recommendation for main table
    let displayRecommendation = '';
    let displayColor = '';
    
    if (isTestingPhase) {
      displayRecommendation = '🧪 Testing Phase';
      displayColor = 'text-purple-700 bg-purple-100 font-semibold';
    } else if (priority >= 4) {
      displayRecommendation = '📈 Scaling Opportunities';
      displayColor = 'text-green-700 bg-green-100 font-semibold';
    } else if (priority <= 2) {
      displayRecommendation = '⚠️ Needs Review';
      displayColor = 'text-red-700 bg-red-100 font-semibold';
    } else {
      displayRecommendation = '⚖️ Maintaining';
      displayColor = 'text-blue-600 bg-blue-50';
    }

    return {
      ...buyer,
      consistencyScore,
      spendVelocity,
      diversificationScore,
      trendDirection,
      recentAvgROI,
      previousAvgROI,
      scalingRecommendation,
      scalingColor,
      priority,
      displayRecommendation,
      displayColor
    };
  });

  // Sort by priority for scaling decisions
  const scalingPriority = [...scalingAnalysis].sort((a, b) => b.priority - a.priority);

  return (
    <Card className="w-full">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{selectedPeriod} Day Media Buyer Analysis</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Time Period:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing data from {selectedDaysAgo.toLocaleDateString('en-US')} to {today.toLocaleDateString('en-US')}
            </div>
          </div>
        </div>

        {/* Executive Summary Dashboard */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">📊 Executive Scaling Summary</h3>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {scalingPriority.filter(b => b.priority === 6).length}
              </div>
              <div className="text-xs text-gray-600">Testing Phase</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {scalingPriority.filter(b => b.priority >= 4 && b.priority < 6).length}
              </div>
              <div className="text-xs text-gray-600">Ready to Scale Up</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {scalingPriority.filter(b => b.priority === 3).length}
              </div>
              <div className="text-xs text-gray-600">Maintain & Optimize</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {scalingPriority.filter(b => b.priority === 2).length}
              </div>
              <div className="text-xs text-gray-600">Reduce Spend</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">
                {scalingPriority.filter(b => b.priority === 1).length}
              </div>
              <div className="text-xs text-gray-600">Scale Back Now</div>
            </div>
          </div>

          {/* Priority Actions */}
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-800">🎯 Immediate Actions Required:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Testing Phase */}
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <h5 className="font-semibold text-purple-800 mb-2">🧪 Testing Phase</h5>
                {(() => {
                  // Get testing campaigns
                  const testingCampaigns = scalingPriority
                    .filter(b => b.priority === 6)
                    .flatMap(buyer => 
                      buyer.offerBreakdown
                        .slice(0, 2) // Top 2 campaigns per buyer
                        .map(offer => ({
                          campaign: `${buyer.name} - ${offer.network} - ${offer.offer}`,
                          roi: offer.roi,
                          spend: offer.spend
                        }))
                    )
                    .sort((a, b) => b.spend - a.spend)
                    .slice(0, 3);

                  return testingCampaigns.length > 0 ? testingCampaigns.map(campaign => (
                    <div key={campaign.campaign} className="flex justify-between items-center py-1 text-sm">
                      <span className="font-medium">{campaign.campaign}</span>
                      <span className="text-purple-700">${campaign.spend.toFixed(0)}</span>
                    </div>
                  )) : (
                    <div className="text-sm text-gray-600 italic">No campaigns in testing phase</div>
                  );
                })()}
              </div>

              {/* Scale Up Candidates */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <h5 className="font-semibold text-green-800 mb-2">🚀 Scale Up Priority</h5>
                {(() => {
                  // Get top campaigns from scale-up buyers
                  const scaleUpCampaigns = scalingPriority
                    .filter(b => b.priority >= 4 && b.priority < 6)
                    .flatMap(buyer => 
                      buyer.offerBreakdown
                        .filter(offer => offer.margin > 0)
                        .slice(0, 2) // Top 2 campaigns per buyer
                        .map(offer => ({
                          campaign: `${buyer.name} - ${offer.network} - ${offer.offer}`,
                          roi: offer.roi,
                          margin: offer.margin
                        }))
                    )
                    .sort((a, b) => b.roi - a.roi)
                    .slice(0, 3);

                  return scaleUpCampaigns.length > 0 ? scaleUpCampaigns.map(campaign => (
                    <div key={campaign.campaign} className="flex justify-between items-center py-1 text-sm">
                      <span className="font-medium">{campaign.campaign}</span>
                      <span className="text-green-700">{campaign.roi.toFixed(1)}% ROI</span>
                    </div>
                  )) : (
                    <div className="text-sm text-gray-600 italic">No immediate scale-up candidates</div>
                  );
                })()}
              </div>

              {/* Scale Back Candidates */}
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <h5 className="font-semibold text-red-800 mb-2">🛑 Scale Back Priority</h5>
                {(() => {
                  // Get worst campaigns from scale-back buyers
                  const scaleBackCampaigns = scalingPriority
                    .filter(b => b.priority <= 2)
                    .flatMap(buyer => 
                      buyer.offerBreakdown
                        .filter(offer => offer.margin < 0 || offer.roi < 0)
                        .slice(0, 2) // Worst 2 campaigns per buyer
                        .map(offer => ({
                          campaign: `${buyer.name} - ${offer.network} - ${offer.offer}`,
                          roi: offer.roi,
                          margin: offer.margin
                        }))
                    )
                    .sort((a, b) => a.roi - b.roi)
                    .slice(0, 3);

                  return scaleBackCampaigns.length > 0 ? scaleBackCampaigns.map(campaign => (
                    <div key={campaign.campaign} className="flex justify-between items-center py-1 text-sm">
                      <span className="font-medium">{campaign.campaign}</span>
                      <span className="text-red-700">{campaign.roi.toFixed(1)}% ROI</span>
                    </div>
                  )) : (
                    <div className="text-sm text-gray-600 italic">No immediate scale-back required</div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media Buyer
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend ({Math.max(3, Math.floor(selectedPeriod / 4))}d)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Spend
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Portfolio
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50" title="10% of Margin">
                  MB Comm
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scalingAnalysis
                .filter(buyer => buyer.name !== 'Unknown')
                .sort((a, b) => b.priority - a.priority)
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
                        <td className={`px-4 py-4 whitespace-nowrap text-sm text-right ${colors.text}`}>
                          {buyer.roi.toFixed(1)}%
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            buyer.trendDirection === 'improving' ? 'bg-green-100 text-green-800' :
                            buyer.trendDirection === 'declining' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {buyer.trendDirection === 'improving' ? '📈 Up' : 
                             buyer.trendDirection === 'declining' ? '📉 Down' : 
                             '➡️ Stable'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                          {formatCurrency(buyer.spendVelocity)}/day
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm text-right ${colors.text}`}>
                          {formatCurrency(buyer.margin)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                          <div className="text-xs">
                            <div className="text-green-600 font-medium">
                              {buyer.offerBreakdown.filter(offer => offer.margin > 0).length} profitable
                            </div>
                            <div className="text-red-600 font-medium">
                              {buyer.offerBreakdown.filter(offer => offer.margin <= 0).length} unprofitable
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm text-right ${colors.text}`}>
                          {formatCurrency(commission)}
                        </td>
                      </tr>
                      {expandedBuyers.has(buyer.name) && (
                        <tr>
                          <td colSpan="7" className="px-4 py-4 bg-gray-50">
                            <div className="space-y-4">
                              {/* Offer Performance Breakdown */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Campaign Performance Breakdown</h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Network - Offer</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Spend</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">% of Total</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Profit</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">ROI</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Days Active</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {buyer.offerBreakdown.map((offer, index) => {
                                        const offerColors = getPerformanceColors(offer.margin, offer.spend);
                                        let actionRecommendation = '';
                                        let actionColor = '';
                                        
                                        if (offer.days < 3 || offer.spend < 500) {
                                          actionRecommendation = '🎓 Learning Phase';
                                          actionColor = 'text-purple-600 font-semibold';
                                        } else if (offer.roi > 25 && offer.spendPercentage < 60) {
                                          actionRecommendation = '🚀 Scale Up';
                                          actionColor = 'text-green-600 font-semibold';
                                        } else if (offer.roi > 10) {
                                          actionRecommendation = '📈 Optimize';
                                          actionColor = 'text-blue-600';
                                        } else if (offer.roi < -10) {
                                          actionRecommendation = '🚫 Consider Pausing';
                                          actionColor = 'text-red-600 font-semibold';
                                        } else if (offer.roi < 5) {
                                          actionRecommendation = '⚠️ Monitor Closely';
                                          actionColor = 'text-yellow-600';
                                        } else {
                                          actionRecommendation = '✅ Maintain';
                                          actionColor = 'text-gray-600';
                                        }
                                        
                                        return (
                                          <tr key={offer.networkOffer} className={`hover:bg-gray-50 ${offerColors.row}`}>
                                            <td className="px-3 py-2 text-sm">
                                              <div className="flex items-center">
                                                <span className={`w-2 h-2 rounded-full mr-2 ${offer.margin > 0 ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                                {offer.networkOffer}
                                              </div>
                                            </td>
                                            <td className="px-3 py-2 text-sm text-right">{formatCurrency(offer.spend)}</td>
                                            <td className="px-3 py-2 text-sm text-right">{offer.spendPercentage.toFixed(1)}%</td>
                                            <td className="px-3 py-2 text-sm text-right">{formatCurrency(offer.revenue)}</td>
                                            <td className={`px-3 py-2 text-sm text-right ${offerColors.text}`}>
                                              {formatCurrency(offer.margin)}
                                            </td>
                                            <td className={`px-3 py-2 text-sm text-right ${offerColors.text}`}>
                                              {offer.roi.toFixed(1)}%
                                            </td>
                                            <td className="px-3 py-2 text-sm text-center">{offer.days}</td>
                                            <td className={`px-3 py-2 text-sm text-center ${actionColor}`}>
                                              {actionRecommendation}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
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

export default MediaBuyerAnalysis; 