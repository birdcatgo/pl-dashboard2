import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Award, Info, ArrowUp, ArrowDown, Pause, HelpCircle, Search, Filter, Download, Eye, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Memoized utility functions for better performance
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

// Memoized Badge component
const Badge = React.memo(({ children, className }) => {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
});

// Memoized Tooltip component
const Tooltip = React.memo(({ children, content }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-10 p-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs -top-2 left-full ml-2 whitespace-normal">
          {content}
          <div className="absolute top-2 -left-1 w-2 h-2 bg-gray-800 rotate-45"></div>
        </div>
      )}
    </div>
  );
});

// Memoized data availability notice
const DataAvailabilityNotice = React.memo(({ totalOffers, dateRange, totalEntriesInRange }) => {
  if (totalOffers >= 5) return null; // Only show when data is limited
  
  const startDate = dateRange.startDate?.toLocaleDateString();
  const endDate = dateRange.endDate?.toLocaleDateString();
  
  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2">Limited Data Available</h4>
            <p className="text-sm text-yellow-700 mb-2">
              Only {totalOffers} offer combinations found with activity from {startDate} to {endDate}.
            </p>
            <p className="text-sm text-yellow-700">
              💡 <strong>Tip:</strong> Try expanding the date range to see more historical performance data. 
              Most campaign data appears to be from earlier time periods.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Scaling recommendation engine
const getScalingRecommendation = (metrics) => {
  const { roi, totalMargin, consistency, volumeTrend, marginTrend, daysActive } = metrics;
  
  // Handle edge cases first
  
  // Insufficient data: Very few data points (< 3 days) - always test
  if (daysActive < 3) {
    return {
      action: 'INSUFFICIENT_DATA',
      label: '📊 Insufficient Data',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      reason: 'Less than 3 days of data',
      recommendation: 'Gather more data before making decisions'
    };
  }
  
  // Unrealistic ROI with low volume - likely data quality issue
  if (roi > 200 && totalMargin < 500) {
    return {
      action: 'DATA_REVIEW',
      label: '⚠️ Review Data',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      reason: 'Unusually high ROI with low volume',
      recommendation: 'Check data quality and tracking accuracy'
    };
  }
  
  // Learning Phase: New campaigns (3-7 days) - let them learn
  if (daysActive >= 3 && daysActive < 7) {
    return {
      action: 'LEARNING',
      label: '🧠 Learning Phase',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      reason: 'Campaign in learning phase',
      recommendation: 'Monitor closely, avoid major changes'
    };
  }
  
  // Low Volume: Established campaigns (7+ days) with low total profit
  if (daysActive >= 7 && totalMargin < 500) {
    return {
      action: 'LOW_VOLUME',
      label: '📊 Low Volume',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      reason: 'Low total profit volume',
      recommendation: 'Focus on scaling and optimization'
    };
  }
  
  // Now for established campaigns with sufficient volume
  
  // Negative performance - scale back immediately
  if (roi < 10 || totalMargin < 0) {
    return {
      action: 'SCALE_BACK',
      label: '📉 Scale Back',
      color: 'bg-red-100 text-red-800 border-red-200',
      reason: roi < 10 ? 'Poor ROI' : 'Negative profit',
      recommendation: 'Reduce spend 30-50% or pause'
    };
  }
  
  // Excellent performance with good consistency - scale aggressively
  if (roi >= 50 && consistency >= 70 && marginTrend >= 0) {
    return {
      action: 'SCALE_AGGRESSIVE',
      label: '🚀 Scale Aggressive',
      color: 'bg-green-100 text-green-800 border-green-200',
      reason: 'High ROI with good consistency',
      recommendation: 'Increase budget 50-100%'
    };
  }
  
  // Good performance but needs caution - scale cautiously
  if (roi >= 25 && (consistency >= 50 || marginTrend >= 10)) {
    return {
      action: 'SCALE_CAUTIOUS',
      label: '📈 Scale Cautious',
      color: 'bg-green-100 text-green-800 border-green-200',
      reason: 'Good ROI, scaling with caution',
      recommendation: 'Increase budget 20-30%'
    };
  }
  
  // Maintaining current performance - optimize
  if (roi >= 15 && roi < 25) {
    return {
      action: 'MAINTAIN',
      label: '⚖️ Maintain & Optimize',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reason: 'Moderate performance',
      recommendation: 'Maintain spend, optimize creative'
    };
  }
  
  // Poor consistency or declining trends - review
  if (consistency < 40 || marginTrend < -20) {
    return {
      action: 'DATA_REVIEW',
      label: '⚠️ Review Data',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      reason: consistency < 40 ? 'Poor consistency' : 'Declining performance',
      recommendation: 'Analyze performance patterns'
    };
  }
  
  // Default case
  return {
    action: 'MAINTAIN',
    label: '⚖️ Maintain & Optimize',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    reason: 'Standard performance',
    recommendation: 'Maintain spend, optimize creative'
  };
};

// Performance score calculation
const calculatePerformanceScore = (metrics) => {
  const { roi, consistency, volumeTrend, marginTrend, totalMargin, daysActive } = metrics;
  
  // Calculate average daily margin for volume score
  const avgDailyMargin = daysActive > 0 ? totalMargin / daysActive : 0;
  
  // ROI Score (0-40 points)
  const roiScore = Math.min(40, roi / 5);
  
  // Consistency Score (0-20 points)
  const consistencyScore = consistency * 0.2;
  
  // Growth Score (0-20 points)
  const growthScore = Math.max(0, Math.min(20, (volumeTrend + marginTrend) / 2 * 0.5));
  
  // Volume Score (0-20 points)
  const volumeScore = Math.min(20, Math.max(0, avgDailyMargin / 50));
  
  return Math.round(roiScore + consistencyScore + growthScore + volumeScore);
};

// Function to get media buyer performance for an offer
const getMediaBuyerPerformance = (offerName, performanceData, dateRange) => {
  if (!performanceData?.length || !dateRange) return { profitable: 0, unprofitable: 0 };

  // Helper function to check if a date is within the selected range
  const isDateInRange = (entryDate) => {
    try {
      let date;
      if (entryDate.includes('/')) {
        const [month, day, year] = entryDate.split('/').map(num => parseInt(num, 10));
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(entryDate);
      }
      
      const startDate = dateRange.startDate;
      const endDate = dateRange.endDate;
      
      if (isNaN(date.getTime())) return false;
      return date >= startDate && date <= endDate;
    } catch (error) {
      return false;
    }
  };

  // Filter data for the specific offer and date range
  const offerData = performanceData.filter(entry => {
    const networkOffer = `${entry.Network} - ${entry.Offer}`;
    let normalizedOffer = networkOffer;
    
    // Apply the same Banner/Banner Edge combination logic
    if (normalizedOffer.includes('Banner Edge')) {
      normalizedOffer = normalizedOffer.replace('Banner Edge', 'Banner');
    }
    if (normalizedOffer.includes('- Banner')) {
      normalizedOffer = normalizedOffer.replace('- Banner', '- Banner (Combined)');
    }
    
    return normalizedOffer === offerName && isDateInRange(entry.Date);
  });

  // Group by media buyer
  const buyerData = offerData.reduce((acc, entry) => {
    const buyer = entry['Media Buyer'] || 'Unknown';
    if (!acc[buyer]) {
      acc[buyer] = [];
    }
    
    acc[buyer].push({
      revenue: parseFloat(entry['Total Revenue'] || 0),
      spend: parseFloat(entry['Ad Spend'] || 0),
      margin: parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0)
    });
    
    return acc;
  }, {});

  // Calculate profitability for each media buyer
  let profitable = 0;
  let unprofitable = 0;

  Object.entries(buyerData).forEach(([buyer, data]) => {
    const totalMargin = data.reduce((sum, d) => sum + d.margin, 0);
    if (totalMargin > 0) {
      profitable++;
    } else {
      unprofitable++;
    }
  });

  return { profitable, unprofitable };
};

const OfferScalingTable = ({ offerData, performanceData, dateRange }) => {
  const [sortBy, setSortBy] = useState('totalMargin');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedOffer, setExpandedOffer] = useState(null);

  const sortedData = useMemo(() => {
    const unknownOffers = offerData.filter(offer => offer.networkOffer.toLowerCase().includes('unknown'));
    const regularOffers = offerData.filter(offer => !offer.networkOffer.toLowerCase().includes('unknown'));
    
    // Sort regular offers by the selected criteria
    const sortedRegular = [...regularOffers].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    // Sort unknown offers by the selected criteria
    const sortedUnknown = [...unknownOffers].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    // Return regular offers first, then unknown offers
    return [...sortedRegular, ...sortedUnknown];
  }, [offerData, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleOfferClick = (offer) => {
    if (expandedOffer === offer.networkOffer) {
      setExpandedOffer(null); // Collapse if already expanded
    } else {
      setExpandedOffer(offer.networkOffer); // Expand this offer
    }
  };

  // Get media buyer breakdown for expanded offer
  const getExpandedMediaBuyerBreakdown = (offerName) => {
    if (!performanceData?.length || !dateRange) return [];

    // Helper function to check if a date is within the selected range
    const isDateInRange = (entryDate) => {
      try {
        let date;
        if (entryDate.includes('/')) {
          const [month, day, year] = entryDate.split('/').map(num => parseInt(num, 10));
          date = new Date(year, month - 1, day);
        } else {
          date = new Date(entryDate);
        }
        
        const startDate = dateRange.startDate;
        const endDate = dateRange.endDate;
        
        if (isNaN(date.getTime())) return false;
        return date >= startDate && date <= endDate;
      } catch (error) {
        return false;
      }
    };

    // Filter data for the specific offer and date range
    const offerData = performanceData.filter(entry => {
      const networkOffer = `${entry.Network} - ${entry.Offer}`;
      let normalizedOffer = networkOffer;
      
      // Apply the same Banner/Banner Edge combination logic
      if (normalizedOffer.includes('Banner Edge')) {
        normalizedOffer = normalizedOffer.replace('Banner Edge', 'Banner');
      }
      if (normalizedOffer.includes('- Banner')) {
        normalizedOffer = normalizedOffer.replace('- Banner', '- Banner (Combined)');
      }
      
      return normalizedOffer === offerName && isDateInRange(entry.Date);
    });

    // Filter data for the specific offer and date range

    // Group by media buyer
    const buyerData = offerData.reduce((acc, entry) => {
      const buyer = entry['Media Buyer'] || 'Unknown';
      if (!acc[buyer]) {
        acc[buyer] = [];
      }
      
      acc[buyer].push({
        date: entry.Date,
        revenue: parseFloat(entry['Total Revenue'] || 0),
        spend: parseFloat(entry['Ad Spend'] || 0),
        margin: parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0)
      });
      
      return acc;
    }, {});

    // Calculate metrics for each media buyer
    const results = Object.entries(buyerData).map(([buyer, data]) => {
      const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
      const totalSpend = data.reduce((sum, d) => sum + d.spend, 0);
      const totalMargin = totalRevenue - totalSpend;
      const roi = totalSpend > 0 ? (totalMargin / totalSpend) * 100 : 0;
      const daysActive = data.length;
      const avgDailyMargin = daysActive > 0 ? totalMargin / daysActive : 0;



      return {
        buyer,
        totalRevenue,
        totalSpend,
        totalMargin,
        roi,
        daysActive,
        avgDailyMargin,
        isProfit: totalMargin > 0
      };
    }).sort((a, b) => b.totalMargin - a.totalMargin); // Sort by profit descending



    return results;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                Offer
                <Tooltip content="Click on any offer name to see detailed media buyer breakdown">
                  <Eye className="h-3 w-3 text-blue-400" />
                </Tooltip>
              </div>
            </th>
            <th 
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('performanceScore')}
            >
              <div className="flex items-center justify-center gap-1">
                Score {sortBy === 'performanceScore' && (sortOrder === 'desc' ? '↓' : '↑')}
                <Tooltip content="Performance score from 0-100 based on ROI (40pts), consistency (20pts), growth trends (20pts), and volume scale (20pts)">
                  <HelpCircle className="h-3 w-3 text-gray-400" />
                </Tooltip>
              </div>
            </th>
            <th 
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('roi')}
            >
              <div className="flex items-center justify-end gap-1">
                ROI {sortBy === 'roi' && (sortOrder === 'desc' ? '↓' : '↑')}
                <Tooltip content="Return on Investment: (Total Revenue - Total Spend) ÷ Total Spend × 100%">
                  <HelpCircle className="h-3 w-3 text-gray-400" />
                </Tooltip>
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('totalMargin')}
            >
              <div className="flex items-center gap-1">
                Total Profit
                <Tooltip content="Total profit for the selected time period when active: Total Revenue - Total Ad Spend + Comment Revenue. Breakdown shows ad spend profit vs comment revenue when applicable. Trend shows first half vs second half performance.">
                  <HelpCircle className="h-3 w-3 text-gray-400" />
                </Tooltip>
                {sortBy === 'totalMargin' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center justify-center gap-1">
                Scaling Action
                <Tooltip content="AI-powered recommendation based on performance metrics: Scale Up (🚀📈), Monitor (⚖️), Scale Back (📉), Testing Phase (🧪), or Review Data (⚠️)">
                  <HelpCircle className="h-3 w-3 text-gray-400" />
                </Tooltip>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                Media Buyer Performance
                <Tooltip content="Shows the count of profitable vs unprofitable media buyers for this offer in the selected time period">
                  <HelpCircle className="h-3 w-3 text-gray-400" />
                </Tooltip>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((offer, index) => {
            const scaling = getScalingRecommendation(offer);
            const mediaBuyerPerformance = getMediaBuyerPerformance(offer.networkOffer, performanceData, dateRange);
            const isExpanded = expandedOffer === offer.networkOffer;
            const expandedBreakdown = isExpanded ? getExpandedMediaBuyerBreakdown(offer.networkOffer) : [];
            
            return (
              <React.Fragment key={offer.networkOffer}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div 
                        className={`text-sm font-medium cursor-pointer hover:underline flex items-center gap-2 ${
                          offer.networkOffer.toLowerCase().includes('unknown') 
                            ? 'text-orange-600 hover:text-orange-800' 
                            : 'text-blue-600 hover:text-blue-800'
                        }`}
                        onClick={() => handleOfferClick(offer)}
                        title={offer.networkOffer.toLowerCase().includes('unknown') 
                          ? "Unknown entries represent revenue showing on the network dashboard but not appearing in Redtrack tracking. Click to see breakdown."
                          : "Click to see detailed media buyer breakdown"
                        }
                      >
                        {offer.networkOffer}
                        {isExpanded ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <div className={`
                        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                        ${offer.performanceScore >= 80 ? 'bg-green-100 text-green-800' : 
                          offer.performanceScore >= 60 ? 'bg-blue-100 text-blue-800' :
                          offer.performanceScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}
                      `}>
                        {offer.performanceScore}/100
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPercent(offer.roi)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(offer.totalMargin)}
                    </div>
                    {offer.commentRevenue > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Ad: {formatCurrency(offer.adSpendMargin)} + Comments: {formatCurrency(offer.commentRevenue)}
                      </div>
                    )}
                    <div className={`text-lg font-bold ${offer.marginTrend > 0 ? 'text-green-600' : offer.marginTrend < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {offer.marginTrend > 0 ? '↗' : offer.marginTrend < 0 ? '↘' : '→'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Badge className={`${scaling.color} px-3 py-1`}>
                      {scaling.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm">
                      <span className="text-green-600 font-medium">{mediaBuyerPerformance.profitable} profitable</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600 font-medium">{mediaBuyerPerformance.unprofitable} unprofitable</span>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Media Buyer Breakdown */}
                {isExpanded && (
                  <tr>
                    <td colSpan="6" className="px-6 py-0">
                      <div className="bg-gray-50 border-l-4 border-blue-500 p-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          Media Buyer Performance - {offer.networkOffer}
                        </h4>
                        
                        {/* Overview Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-green-100 p-3 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Profitable Buyers</p>
                            <p className="text-xl font-bold text-green-800">{expandedBreakdown.filter(b => b.isProfit).length}</p>
                          </div>
                          <div className="bg-red-100 p-3 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">Unprofitable Buyers</p>
                            <p className="text-xl font-bold text-red-800">{expandedBreakdown.filter(b => !b.isProfit).length}</p>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Total Profit</p>
                            <p className="text-xl font-bold text-blue-800">{formatCurrency(offer.totalMargin)}</p>
                            {offer.commentRevenue > 0 && (
                              <p className="text-xs text-blue-500 mt-1">
                                Ad Spend: {formatCurrency(offer.adSpendMargin)} | Comments: {formatCurrency(offer.commentRevenue)}
                              </p>
                            )}
                          </div>
                          <div className="bg-purple-100 p-3 rounded-lg">
                            <p className="text-sm text-purple-600 font-medium">Overall ROI</p>
                            <p className="text-xl font-bold text-purple-800">{formatPercent(offer.roi)}</p>
                          </div>
                        </div>

                        {/* Media Buyer Table */}
                        {expandedBreakdown.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Media Buyer
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Total Profit
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    ROI
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Total Spend
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    Days Active
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Avg Daily Profit
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {expandedBreakdown.map((buyer, index) => (
                                  <tr key={buyer.buyer} className={buyer.isProfit ? 'bg-green-50' : 'bg-red-50'}>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                      <div className={`text-sm font-medium text-gray-900 ${
                                        buyer.buyer === 'Unknown' || buyer.buyer === 'Comment Rev' ? 'flex items-center gap-1' : ''
                                      }`}>
                                        {buyer.buyer}
                                        {buyer.buyer === 'Unknown' && (
                                          <Tooltip content="Unknown entries represent revenue showing on the network dashboard but not appearing in Redtrack tracking.">
                                            <HelpCircle className="h-3 w-3 text-orange-400" />
                                          </Tooltip>
                                        )}
                                        {buyer.buyer === 'Comment Rev' && (
                                          <Tooltip content="Comment revenue generated from this offer, not tied to specific ad spend campaigns.">
                                            <MessageCircle className="h-3 w-3 text-blue-400" />
                                          </Tooltip>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right">
                                      <div className={`text-sm font-medium ${buyer.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(buyer.totalMargin)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right">
                                      <div className={`text-sm ${buyer.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatPercent(buyer.roi)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right">
                                      <div className="text-sm text-gray-900">{formatCurrency(buyer.totalSpend)}</div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                      <div className="text-sm text-gray-900">{buyer.daysActive}</div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right">
                                      <div className={`text-sm ${buyer.avgDailyMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(buyer.avgDailyMargin)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        buyer.isProfit 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {buyer.isProfit ? 'Profitable' : 'Losing'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 bg-white rounded-lg">
                            No media buyer data found for this offer in the selected time period.
                          </div>
                        )}
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
  );
};

const ScalingInsights = ({ offerData }) => {
  const insights = useMemo(() => {
    const scaleUpOffers = offerData.filter(offer => {
      const scaling = getScalingRecommendation(offer);
      return scaling.action === 'SCALE_AGGRESSIVE' || scaling.action === 'SCALE_CAUTIOUS';
    });
    
    const scaleBackOffers = offerData.filter(offer => {
      const scaling = getScalingRecommendation(offer);
      return scaling.action === 'SCALE_BACK';
    });
    
    const reviewNeededOffers = offerData.filter(offer => {
      const scaling = getScalingRecommendation(offer);
      return scaling.action === 'DATA_REVIEW' || scaling.action === 'INSUFFICIENT_DATA';
    });

    const learningOffers = offerData.filter(offer => {
      const scaling = getScalingRecommendation(offer);
      return scaling.action === 'LEARNING';
    });

    const lowVolumeOffers = offerData.filter(offer => {
      const scaling = getScalingRecommendation(offer);
      return scaling.action === 'LOW_VOLUME';
    });

    const totalPotentialGain = scaleUpOffers.reduce((sum, offer) => sum + offer.totalMargin * 30, 0);
    const totalAtRisk = scaleBackOffers.reduce((sum, offer) => sum + offer.totalMargin * 30, 0);

    return {
      scaleUpCount: scaleUpOffers.length,
      scaleBackCount: scaleBackOffers.length,
      reviewNeededCount: reviewNeededOffers.length,
      learningCount: learningOffers.length,
      lowVolumeCount: lowVolumeOffers.length,
      totalPotentialGain,
      totalAtRisk,
      topPerformer: offerData.reduce((top, offer) => 
        offer.performanceScore > (top?.performanceScore || 0) ? offer : top, null
      )
    };
  }, [offerData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scale Up Opportunities</p>
              <p className="text-2xl font-bold text-green-600">{insights.scaleUpCount}</p>
            </div>
            <ArrowUp className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Potential: {formatCurrency(insights.totalPotentialGain * 0.3)} monthly gain
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scale Back Needed</p>
              <p className="text-2xl font-bold text-red-600">{insights.scaleBackCount}</p>
            </div>
            <ArrowDown className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            At Risk: {formatCurrency(insights.totalAtRisk)} monthly
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Learning Phase</p>
              <p className="text-2xl font-bold text-purple-600">{insights.learningCount}</p>
            </div>
            <HelpCircle className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            New campaigns learning
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Volume</p>
              <p className="text-2xl font-bold text-yellow-600">{insights.lowVolumeCount}</p>
            </div>
            <Target className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Need volume optimization
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Need Review</p>
              <p className="text-2xl font-bold text-orange-600">{insights.reviewNeededCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Data quality or insufficient data
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Header with Search and Filters
const OfferPerformanceHeader = React.memo(({ 
  searchQuery, 
  setSearchQuery, 
  selectedFilter, 
  setSelectedFilter, 
  onExport,
  totalOffers,
  dateRange,
  allOffers,
  activeMediaBuyers
}) => {
  const [showMetrics, setShowMetrics] = useState(false);

  // Memoize expensive computations
  const mediaBuyerOptions = useMemo(() => [
    { value: 'all', label: 'All Media Buyers' },
    ...(() => {
      if (!activeMediaBuyers?.length) return [];
      
      // Separate regular buyers from Unknown
      const regularBuyers = activeMediaBuyers.filter(buyer => buyer !== 'Unknown').sort();
      const unknownBuyers = activeMediaBuyers.filter(buyer => buyer === 'Unknown');
      
      // Return sorted options with Unknown at bottom
      return [
        ...regularBuyers.map(buyer => ({ value: buyer, label: buyer })),
        ...unknownBuyers.map(buyer => ({ value: buyer, label: buyer }))
      ];
    })()
  ], [activeMediaBuyers]);

  // Memoize network offer options
  const networkOfferOptions = useMemo(() => [
    { value: 'all', label: 'All Offers' },
    ...(() => {
      if (!allOffers?.length) return [];
      
      // Get unique network offers, sorted
      const uniqueOffers = [...new Set(allOffers.map(offer => offer.networkOffer))].sort();
      
      return uniqueOffers.map(offer => ({ value: offer, label: offer }));
    })()
  ], [allOffers]);

  const formatDateRange = useCallback(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return '';
    return `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`;
  }, [dateRange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Offer Scaling Intelligence</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-500">
              AI-powered scaling recommendations for {totalOffers} offers
            </p>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              📅 {formatDateRange()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMetrics(!showMetrics)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Info className="h-4 w-4 mr-2" />
              {showMetrics ? 'Hide' : 'Show'} Metrics Guide
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Metrics Explanation - Inline */}
      {showMetrics && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">📊 Performance Score (0-100)</h4>
                <p className="text-gray-700">
                  <strong>ROI Impact (40pts):</strong> Higher ROI = higher score<br/>
                  <strong>Consistency (20pts):</strong> Stable daily margins<br/>
                  <strong>Growth Trends (20pts):</strong> Improving volume/margins<br/>
                  <strong>Volume Scale (20pts):</strong> Higher daily margins
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">💰 Total Profit</h4>
                <p className="text-gray-700">
                  <strong>Total:</strong> Revenue - Ad Spend for time period<br/>
                  <strong>Trend:</strong> First half vs second half performance<br/>
                  <strong>Volume:</strong> Shows actual profit generated when active
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">🎯 Scaling Actions</h4>
                <p className="text-gray-700">
                  <strong>🚀 Scale Aggressive:</strong> Increase budget 50-100%<br/>
                  <strong>📈 Scale Cautious:</strong> Increase budget 20-30%<br/>
                  <strong>🧠 Learning Phase:</strong> Monitor, avoid changes<br/>
                  <strong>📊 Low Volume:</strong> Focus on scaling up<br/>
                  <strong>📉 Scale Back:</strong> Reduce budget 30-50%<br/>
                  <strong>⚠️ Review Data:</strong> Check data quality first
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            {networkOfferOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            {mediaBuyerOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
});

// Priority Offers Section
const PriorityOffersSection = ({ offerData }) => {
  const priorityOffers = useMemo(() => {
    const scaleAggressive = offerData.filter(offer => {
      const scaling = getScalingRecommendation(offer);
      return scaling.action === 'SCALE_AGGRESSIVE';
    }).slice(0, 3);

    const scaleBack = offerData.filter(offer => {
      const scaling = getScalingRecommendation(offer);
      return scaling.action === 'SCALE_BACK';
    }).slice(0, 3);

    const dataReview = offerData.filter(offer => {
      const scaling = getScalingRecommendation(offer);
      return scaling.action === 'DATA_REVIEW';
    }).slice(0, 3);

    return { scaleAggressive, scaleBack, dataReview };
  }, [offerData]);

  if (!priorityOffers.scaleAggressive.length && !priorityOffers.scaleBack.length && !priorityOffers.dataReview.length) {
    return null;
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Star className="h-5 w-5" />
          Priority Actions Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {priorityOffers.scaleAggressive.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-800 mb-2">🚀 Scale Up Immediately:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {priorityOffers.scaleAggressive.map(offer => (
                <div key={offer.networkOffer} className="bg-green-100 p-3 rounded text-sm">
                  <div className="font-medium">{offer.networkOffer}</div>
                  <div className="text-green-700">
                    {formatPercent(offer.roi)} ROI • {formatCurrency(offer.totalMargin)}/day
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {priorityOffers.scaleBack.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-800 mb-2">📉 Scale Back Urgent:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {priorityOffers.scaleBack.map(offer => (
                <div key={offer.networkOffer} className="bg-red-100 p-3 rounded text-sm">
                  <div className="font-medium">{offer.networkOffer}</div>
                  <div className="text-red-700">
                    {formatPercent(offer.roi)} ROI • {formatCurrency(offer.totalMargin)}/day
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {priorityOffers.dataReview.length > 0 && (
          <div>
            <h4 className="font-semibold text-orange-800 mb-2">⚠️ Data Review Required:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {priorityOffers.dataReview.map(offer => (
                <div key={offer.networkOffer} className="bg-orange-100 p-3 rounded text-sm">
                  <div className="font-medium">{offer.networkOffer}</div>
                  <div className="text-orange-700">
                    {formatPercent(offer.roi)} ROI • {formatCurrency(offer.totalMargin)}/day
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EnhancedOfferPerformance = ({ performanceData, dateRange }) => {
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Memoize active media buyers with dependency tracking
  const getActiveMediaBuyers = useMemo(() => {
    if (!performanceData?.length) return [];
    
    console.log('🔄 Computing active media buyers...');
    
    // Exclude inactive media buyers
    const inactiveBuyers = ['Edwin', 'Nick N', 'CF'];
    
    // Get media buyers who have activity in the last 60 days
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 60);
    
    const activeBuyers = new Set();
    
    // Batch process for better performance
    const validEntries = performanceData.filter(entry => {
      try {
        const entryDate = new Date(entry.Date);
        return entryDate >= recentDate;
      } catch (error) {
        return false;
      }
    });

    validEntries.forEach(entry => {
      const buyer = entry['Media Buyer'] || 'Unknown';
      // Exclude inactive buyers
      if (!inactiveBuyers.includes(buyer)) {
        activeBuyers.add(buyer);
      }
    });
    
    console.log(`✅ Found ${activeBuyers.size} active media buyers`);
    return Array.from(activeBuyers);
  }, [performanceData]); // Remove dateRange dependency to prevent recalculation

  // Cache date range check function
  const createDateChecker = useCallback((dateRange) => {
    if (!dateRange?.startDate || !dateRange?.endDate) return () => false;
    
    const startTime = dateRange.startDate.getTime();
    const endTime = dateRange.endDate.getTime();
    
    return (entryDate) => {
      try {
        let date;
        if (entryDate.includes('/')) {
          const [month, day, year] = entryDate.split('/').map(num => parseInt(num, 10));
          date = new Date(year, month - 1, day);
        } else {
          date = new Date(entryDate);
        }
        
        if (isNaN(date.getTime())) return false;
        const dateTime = date.getTime();
        return dateTime >= startTime && dateTime <= endTime;
      } catch (error) {
        return false;
      }
    };
  }, []);

  // Optimize offer data processing with significant performance improvements
  const offerData = useMemo(() => {
    if (!performanceData?.length || !dateRange) {
      console.log('⚠️ No data or date range available');
      return [];
    }

    console.log('🔄 Processing offer data...', {
      totalEntries: performanceData.length,
      dateRange: {
        start: dateRange.startDate?.toDateString(),
        end: dateRange.endDate?.toDateString()
      }
    });

    const startTime = performance.now();
    
    // Create optimized date checker
    const isDateInRange = createDateChecker(dateRange);

    // Define suspicious/invalid network-offer combinations to filter out
    const invalidCombinations = new Set([
      'LG - Solar', 'Leadnomic - Health', 'Leadnomic - Bath', 
      'Pure Ads - Windows', 'LG - Roofing', ' - ', ' - Roofing', 'Unknown - Solar'
    ]);

    // Pre-filter and batch process data for better performance
    const validEntries = performanceData.filter(entry => {
      if (!isDateInRange(entry.Date)) return false;
      
      let networkOffer = `${entry.Network} - ${entry.Offer}`;
      
      // Apply Banner/Banner Edge combination logic
      if (networkOffer.includes('Banner Edge')) {
        networkOffer = networkOffer.replace('Banner Edge', 'Banner');
      }
      if (networkOffer.includes('- Banner')) {
        networkOffer = networkOffer.replace('- Banner', '- Banner (Combined)');
      }
      
      return !invalidCombinations.has(networkOffer);
    });

    console.log(`📊 Filtered to ${validEntries.length} valid entries from ${performanceData.length} total`);

    // Group data by network-offer combination
    const groupedData = validEntries.reduce((acc, entry) => {
      let networkOffer = `${entry.Network} - ${entry.Offer}`;
      
      // Apply same normalization
      if (networkOffer.includes('Banner Edge')) {
        networkOffer = networkOffer.replace('Banner Edge', 'Banner');
      }
      if (networkOffer.includes('- Banner')) {
        networkOffer = networkOffer.replace('- Banner', '- Banner (Combined)');
      }
      
      if (!acc[networkOffer]) {
        acc[networkOffer] = [];
      }
      
      acc[networkOffer].push({
        date: entry.Date,
        revenue: parseFloat(entry['Total Revenue'] || 0),
        spend: parseFloat(entry['Ad Spend'] || 0),
        margin: parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0),
        mediaBuyer: entry['Media Buyer'] || 'Unknown'
      });
      
      return acc;
    }, {});

    console.log(`🏢 Processing ${Object.keys(groupedData).length} unique offers`);

    // Calculate metrics for each offer with optimized calculations
    const result = Object.entries(groupedData).map(([networkOffer, data]) => {
      // Sort by date once
      const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Batch calculate totals and separate comment revenue
      let totalRevenue = 0;
      let totalSpend = 0;
      let totalMargin = 0;
      let commentRevenue = 0;
      let adSpendMargin = 0;
      const margins = new Array(sortedData.length);
      
      for (let i = 0; i < sortedData.length; i++) {
        const item = sortedData[i];
        totalRevenue += item.revenue;
        totalSpend += item.spend;
        
        // Separate comment revenue from ad spend-based margin
        if (item.mediaBuyer === 'Comment Rev') {
          commentRevenue += item.revenue;
        } else {
          adSpendMargin += item.margin;
        }
        
        totalMargin += item.margin;
        margins[i] = item.margin;
      }
      
      const roi = totalSpend > 0 ? (totalMargin / totalSpend) * 100 : 0;
      
      // Optimized consistency calculation
      const mean = totalMargin / sortedData.length;
      let variance = 0;
      for (let i = 0; i < margins.length; i++) {
        const diff = margins[i] - mean;
        variance += diff * diff;
      }
      const stdDev = Math.sqrt(variance / margins.length);
      
      let consistency = 0;
      if (stdDev === 0) {
        consistency = 100;
      } else if (mean === 0) {
        consistency = 0;
      } else {
        const coefficientOfVariation = stdDev / Math.abs(mean);
        consistency = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
      }
      
      // Optimized trend calculations
      const halfPoint = Math.floor(sortedData.length / 2);
      const firstHalf = sortedData.slice(0, halfPoint);
      const secondHalf = sortedData.slice(halfPoint);
      
      const firstHalfAvg = firstHalf.length > 0 ? 
        firstHalf.reduce((sum, d) => sum + d.margin, 0) / firstHalf.length : 0;
      const secondHalfAvg = secondHalf.length > 0 ? 
        secondHalf.reduce((sum, d) => sum + d.margin, 0) / secondHalf.length : 0;
      
      const marginTrend = firstHalfAvg !== 0 ? 
        ((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100 : 0;
      
      // Volume trend (spend growth)
      const firstHalfSpend = firstHalf.length > 0 ? 
        firstHalf.reduce((sum, d) => sum + d.spend, 0) / firstHalf.length : 0;
      const secondHalfSpend = secondHalf.length > 0 ? 
        secondHalf.reduce((sum, d) => sum + d.spend, 0) / secondHalf.length : 0;
      
      const volumeTrend = firstHalfSpend !== 0 ? 
        ((secondHalfSpend - firstHalfSpend) / Math.abs(firstHalfSpend)) * 100 : 0;

      // Get unique media buyers for this offer
      const mediaBuyers = [...new Set(sortedData.map(d => d.mediaBuyer))];

      const metrics = {
        networkOffer,
        totalRevenue,
        totalSpend,
        totalMargin,
        commentRevenue,
        adSpendMargin,
        roi,
        consistency,
        marginTrend,
        volumeTrend,
        daysActive: sortedData.length,
        mediaBuyers
      };

      return {
        ...metrics,
        performanceScore: calculatePerformanceScore(metrics)
      };
    }).filter(offer => offer.daysActive > 0);

    const endTime = performance.now();
    console.log(`✅ Offer data processing completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`📈 Generated ${result.length} offers with performance data`);

    return result;
  }, [performanceData, dateRange, createDateChecker]);

  // Filter and search offers with optimized filtering
  const filteredOffers = useMemo(() => {
    console.log('🔍 Filtering offers...', { searchQuery, selectedFilter, totalOffers: offerData.length });
    
    let filtered = offerData;

    // Apply network offer dropdown filter
    if (searchQuery && searchQuery !== 'all') {
      filtered = filtered.filter(offer => 
        offer.networkOffer === searchQuery
      );
    }

    // Apply media buyer filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(offer => 
        offer.mediaBuyers.includes(selectedFilter)
      );
    }

    console.log(`📋 Filtered to ${filtered.length} offers`);
    return filtered;
  }, [offerData, searchQuery, selectedFilter]);

  // Optimized export functionality
  const handleExport = useCallback(() => {
    console.log('📤 Exporting data...');
    
    const csv = [
      ['Offer', 'Performance Score', 'ROI %', 'Daily Profit', 'Days Active', 'Scaling Action', 'Recommendation'].join(','),
      ...filteredOffers.map(offer => {
        const scaling = getScalingRecommendation(offer);
        return [
          offer.networkOffer,
          offer.performanceScore,
          offer.roi.toFixed(1),
          offer.totalMargin.toFixed(2),
          offer.daysActive,
          scaling.label.replace(/[🚀📈🧪📉⚖️⚠️📊]/g, ''),
          scaling.recommendation
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offer-scaling-recommendations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Export completed');
  }, [filteredOffers]);

  // Show loading state while processing
  if (!performanceData?.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (offerData.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">
          No offer data found for the selected date range. Try expanding the date range or check your data source.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OfferPerformanceHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        onExport={handleExport}
        totalOffers={offerData.length}
        dateRange={dateRange}
        allOffers={offerData}
        activeMediaBuyers={getActiveMediaBuyers}
      />

      <DataAvailabilityNotice 
        totalOffers={offerData.length} 
        dateRange={dateRange} 
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Scaling Recommendations
            </CardTitle>
            <div className="text-sm text-gray-500">
              Showing {filteredOffers.length} of {offerData.length} offers
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <OfferScalingTable offerData={filteredOffers} performanceData={performanceData} dateRange={dateRange} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedOfferPerformance; 