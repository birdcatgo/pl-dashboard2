import React, { useMemo, useState } from 'react';
import { HelpCircle, TrendingUp, TrendingDown, CircleDot, Minus, Info, ChevronDown, Download, AlertTriangle, CheckCircle, Calendar, Eye, Zap, Users, Network } from 'lucide-react';
import StatusPill from '@/components/ui/StatusPill';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

const formatCurrency = (value) => {
  if (!value) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value) => {
  if (!value || isNaN(value)) return '0%';
  return `${Number(value).toFixed(1)}%`;
};

// New component for profit/loss indicator
const ProfitIndicator = ({ value, showIcon = false }) => {
  const isProfit = value > 0;
  const isBreakeven = value === 0;
  
  if (isBreakeven) {
    return (
      <div className="flex items-center gap-1 text-gray-500">
        {showIcon && <Minus className="h-3 w-3" />}
        <span className="font-medium">{formatCurrency(value)}</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
      {showIcon && (isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
      <span className="font-semibold">{formatCurrency(value)}</span>
    </div>
  );
};

// Enhanced ROI display with color coding
const ROIDisplay = ({ roi, size = 'sm' }) => {
  const getROIColor = (roi) => {
    if (roi >= 50) return 'text-emerald-600 bg-emerald-50';
    if (roi >= 20) return 'text-green-600 bg-green-50';
    if (roi >= 0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };
  
  const textSize = size === 'lg' ? 'text-sm' : 'text-xs';
  const padding = size === 'lg' ? 'px-2 py-1' : 'px-1.5 py-0.5';
  
  return (
    <span className={`${textSize} font-medium rounded-md ${padding} ${getROIColor(roi)}`}>
      {formatPercent(roi)}
    </span>
  );
};

// Time Period Selector Component
const TimePeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const periods = [
    { value: '7d', label: '7 Days', icon: '📊' },
    { value: '30d', label: '30 Days', icon: '📊' },
    { value: '90d', label: '90 Days', icon: '📈' },
    { value: '180d', label: '6 Months', icon: '📅' },
    { value: '365d', label: '1 Year', icon: '📅' }
  ];

  const selectedPeriodLabel = periods.find(p => p.value === selectedPeriod)?.label || '30 Days';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[120px]"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">{selectedPeriodLabel}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => {
                onPeriodChange(period.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                selectedPeriod === period.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <span>{period.icon}</span>
              <span>{period.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const getTrendStatus = (data) => {
  if (!data || data.length < 2) return 'neutral';
  
  // Calculate the average of the last 3 values (or all if less than 3)
  const recentValues = data.slice(-3);
  const avgRecentValue = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
  
  // Calculate the average of the previous 3 values (or all if less than 3)
  const previousValues = data.slice(-6, -3);
  const avgPreviousValue = previousValues.length > 0 ? 
    previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length : 
    avgRecentValue;
  
  // Calculate percentage change
  const change = ((avgRecentValue - avgPreviousValue) / Math.abs(avgPreviousValue)) * 100;
  
  // Determine trend status
  if (change > 5) return 'improving';
  if (change < -5) return 'volatile';
  if (Math.abs(change) <= 5) return 'neutral';
  return 'neutral';
};

const TrendGraph = ({ data, width = 100, height = 40 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 rounded border border-gray-200 flex items-center justify-center" style={{width: `${width}px`, height: `${height}px`}}>
        <span className="text-gray-400 text-xs">No data</span>
      </div>
    );
  }

  // Filter out any NaN or invalid values and ensure we have numbers
  const validData = data.filter(value => 
    typeof value === 'number' && 
    !isNaN(value) && 
    isFinite(value)
  ).map(value => Number(value));
  
  if (validData.length === 0) {
    return (
      <div className="bg-gray-50 rounded border border-gray-200 flex items-center justify-center" style={{width: `${width}px`, height: `${height}px`}}>
        <span className="text-gray-400 text-xs">No data</span>
      </div>
    );
  }

  // If we only have one data point, show a simple indicator
  if (validData.length === 1) {
    return (
      <div className="bg-gray-50 rounded border border-gray-200 flex items-center justify-center" style={{width: `${width}px`, height: `${height}px`}}>
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      </div>
    );
  }

  const maxValue = Math.max(...validData);
  const minValue = Math.min(...validData);
  const range = maxValue - minValue;
  
  // Add proper padding for the SVG content
  const svgPadding = 4;
  const svgWidth = width - (svgPadding * 2);
  const svgHeight = height - (svgPadding * 2);
  
  // Handle case where all values are the same
  if (range === 0) {
    const y = svgHeight / 2;
    const points = validData.map((_, index) => {
      const xPadding = svgWidth * 0.1;
      const availableWidth = svgWidth - (xPadding * 2);
      const x = xPadding + (index / (validData.length - 1)) * availableWidth;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="bg-gray-50 rounded border border-gray-200 p-1" style={{width: `${width}px`, height: `${height}px`}}>
        <svg width={svgWidth} height={svgHeight} className="block">
          <polyline
            points={points}
            fill="none"
            stroke="#6B7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  
  const points = validData.map((value, index) => {
    const xPadding = svgWidth * 0.15; // More x padding
    const yPadding = svgHeight * 0.15; // More y padding
    const availableWidth = svgWidth - (xPadding * 2);
    const availableHeight = svgHeight - (yPadding * 2);
    
    const x = xPadding + (index / (validData.length - 1)) * availableWidth;
    // Ensure y is always within bounds with proper padding
    const normalizedValue = (value - minValue) / range;
    const y = yPadding + (1 - normalizedValue) * availableHeight;
    
    // Double-check bounds to prevent overflow
    const clampedX = Math.max(0, Math.min(svgWidth, x));
    const clampedY = Math.max(yPadding, Math.min(svgHeight - yPadding, y));
    
    return `${clampedX.toFixed(2)},${clampedY.toFixed(2)}`;
  }).join(' ');

  const status = getTrendStatus(validData);
  const colors = {
    improving: '#10B981',
    volatile: '#F59E0B',
    new: '#3B82F6',
    neutral: '#6B7280'
  };

  return (
    <div className="bg-gray-50 rounded border border-gray-200 p-1" style={{width: `${width}px`, height: `${height}px`}}>
      <svg width={svgWidth} height={svgHeight} className="block">
        <polyline
          points={points}
          fill="none"
          stroke={colors[status]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Add dots for data points */}
        {validData.map((value, index) => {
          const xPadding = svgWidth * 0.15;
          const yPadding = svgHeight * 0.15;
          const availableWidth = svgWidth - (xPadding * 2);
          const availableHeight = svgHeight - (yPadding * 2);
          
          const x = xPadding + (index / (validData.length - 1)) * availableWidth;
          const normalizedValue = (value - minValue) / range;
          const y = yPadding + (1 - normalizedValue) * availableHeight;
          
          // Double-check bounds
          const clampedX = Math.max(0, Math.min(svgWidth, x));
          const clampedY = Math.max(yPadding, Math.min(svgHeight - yPadding, y));
          
          return (
            <circle
              key={index}
              cx={clampedX.toFixed(2)}
              cy={clampedY.toFixed(2)}
              r="2"
              fill={colors[status]}
              opacity="0.8"
            />
          );
        })}
      </svg>
    </div>
  );
};

// Enhanced Summary Stats Component with better design
const SummaryStats = ({ data }) => {
  const stats = useMemo(() => {
    const profitable = data.filter(row => row.Margin > 0);
    const unprofitable = data.filter(row => row.Margin <= 0);
    const totalRevenue = data.reduce((sum, row) => sum + row.revenue, 0);
    const totalSpend = data.reduce((sum, row) => sum + row.adSpend, 0);
    const totalMargin = data.reduce((sum, row) => sum + row.Margin, 0);
    const overallROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    
    return {
      profitable: profitable.length,
      unprofitable: unprofitable.length,
      total: data.length,
      profitablePercentage: data.length > 0 ? (profitable.length / data.length) * 100 : 0,
      totalRevenue,
      totalSpend,
      totalMargin,
      overallROI
    };
  }, [data]);

  const StatCard = ({ title, value, subtitle, icon: Icon, iconColor, bgColor, textColor }) => (
    <div className={`${bgColor} rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${iconColor}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
          </div>
          <div className={`text-3xl font-bold ${textColor} mb-1`}>
            {value}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Profitable Campaigns"
        value={stats.profitable}
        subtitle={`${stats.profitablePercentage.toFixed(1)}% of all campaigns`}
        icon={CheckCircle}
        iconColor="bg-green-500"
        bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
        textColor="text-green-700"
      />
      
      <StatCard
        title="Unprofitable Campaigns"
        value={stats.unprofitable}
        subtitle={`${(100 - stats.profitablePercentage).toFixed(1)}% of all campaigns`}
        icon={AlertTriangle}
        iconColor="bg-red-500"
        bgColor="bg-gradient-to-br from-red-50 to-pink-50"
        textColor="text-red-700"
      />
      
      <StatCard
        title="Overall ROI"
        value={<ROIDisplay roi={stats.overallROI} size="lg" />}
        subtitle="Return on investment"
        icon={TrendingUp}
        iconColor="bg-blue-500"
        bgColor="bg-gradient-to-br from-blue-50 to-indigo-50"
        textColor="text-blue-700"
      />
      
      <StatCard
        title="Net Profit"
        value={<ProfitIndicator value={stats.totalMargin} />}
        subtitle="Total margin across campaigns"
        icon={CircleDot}
        iconColor="bg-purple-500"
        bgColor="bg-gradient-to-br from-purple-50 to-violet-50"
        textColor="text-purple-700"
      />
    </div>
  );
};

// Helper function to get active media buyers from performance data
const getActiveMediaBuyers = (performanceData) => {
  if (!performanceData?.length) return [];
  
  // Exclude inactive media buyers
  const inactiveBuyers = ['Edwin', 'Nick N', 'CF'];
  
  // Get unique media buyers who have recent activity (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30);
  
  const activeBuyers = performanceData
    .filter(entry => {
      if (!entry['Media Buyer'] || entry['Media Buyer'] === 'Unknown') return false;
      
      // Exclude inactive buyers
      if (inactiveBuyers.includes(entry['Media Buyer'])) return false;
      
      // Parse date and check if within last 30 days
      let entryDate;
      try {
        entryDate = new Date(entry.Date);
        if (isNaN(entryDate.getTime()) && entry.Date.includes('/')) {
          const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
          entryDate = new Date(year, month - 1, day);
        }
        return entryDate >= thirtyDaysAgo;
      } catch {
        return false;
      }
    })
    .map(entry => entry['Media Buyer'])
    .filter((buyer, index, arr) => arr.indexOf(buyer) === index); // unique values
  
  return activeBuyers.sort();
};

// Anomaly Detection Functions
const detectAnomalies = (data, performanceData) => {
  const anomalies = [];

  // Group data by network-offer combinations
  const networkOfferGroups = data.reduce((acc, row) => {
    const key = `${row.network}-${row.offer}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {});

  // 1. Detect Media Buyer Outliers within Network-Offer combinations
  Object.entries(networkOfferGroups).forEach(([networkOffer, rows]) => {
    if (rows.length < 2) return; // Need at least 2 buyers to detect outliers
    
    const [network, offer] = networkOffer.split('-');
    const profitable = rows.filter(r => r.Margin > 0);
    const unprofitable = rows.filter(r => r.Margin <= 0);
    
    // If most are profitable but one isn't
    if (profitable.length >= 2 && unprofitable.length === 1) {
      const outlier = unprofitable[0];
      const avgProfitableROI = profitable.reduce((sum, r) => sum + r.ROI, 0) / profitable.length;
      anomalies.push({
        type: 'underperformer',
        severity: 'high',
        title: 'Underperformer Detected',
        description: `**${outlier.mediaBuyer}** unprofitable with **${network} ${offer}**. ${profitable.length} others averaging ${avgProfitableROI.toFixed(1)}% ROI`,
        mediaBuyer: outlier.mediaBuyer,
        network,
        offer,
        impact: Math.abs(outlier.Margin)
      });
    }
    
    // If most are unprofitable but one is very profitable
    if (unprofitable.length >= 2 && profitable.length === 1) {
      const outlier = profitable[0];
      if (outlier.ROI > 20) { // Only flag if significantly profitable
        anomalies.push({
          type: 'overperformer',
          severity: 'medium',
          title: 'Exceptional Performance',
          description: `**${outlier.mediaBuyer}** highly profitable (${outlier.ROI.toFixed(1)}% ROI) with **${network} ${offer}**. ${unprofitable.length} others unprofitable`,
          mediaBuyer: outlier.mediaBuyer,
          network,
          offer,
          impact: outlier.Margin
        });
      }
    }
  });

  // 2. Detect Network Performance Discrepancies for same offers
  const offerGroups = data.reduce((acc, row) => {
    if (!acc[row.offer]) {
      acc[row.offer] = {};
    }
    if (!acc[row.offer][row.network]) {
      acc[row.offer][row.network] = [];
    }
    acc[row.offer][row.network].push(row);
    return acc;
  }, {});

  Object.entries(offerGroups).forEach(([offer, networks]) => {
    const networkNames = Object.keys(networks);
    if (networkNames.length < 2) return;

    networkNames.forEach(network1 => {
      networkNames.forEach(network2 => {
        if (network1 >= network2) return;
        
        const network1Data = networks[network1];
        const network2Data = networks[network2];
        
        const network1AvgROI = network1Data.reduce((sum, r) => sum + r.ROI, 0) / network1Data.length;
        const network2AvgROI = network2Data.reduce((sum, r) => sum + r.ROI, 0) / network2Data.length;
        
        const roiDifference = Math.abs(network1AvgROI - network2AvgROI);
        
        if (roiDifference > 15) { // Significant difference
          const betterNetwork = network1AvgROI > network2AvgROI ? network1 : network2;
          const worseNetwork = network1AvgROI > network2AvgROI ? network2 : network1;
          const betterROI = Math.max(network1AvgROI, network2AvgROI);
          const worseROI = Math.min(network1AvgROI, network2AvgROI);
          
          anomalies.push({
            type: 'network_discrepancy',
            severity: roiDifference > 30 ? 'high' : 'medium',
            title: 'Network Discrepancy',
            description: `**${offer}** performs better on **${betterNetwork}** (${betterROI.toFixed(1)}% ROI) vs **${worseNetwork}** (${worseROI.toFixed(1)}% ROI)`,
            offer,
            betterNetwork,
            worseNetwork,
            impact: roiDifference
          });
        }
      });
    });
  });

  // 3. Detect Extreme Performers
  const extremePerformers = data.filter(row => 
    (row.ROI > 50 || row.ROI < -50) && Math.abs(row.Margin) > 1000
  );

  extremePerformers.forEach(row => {
    if (row.ROI > 50) {
      anomalies.push({
        type: 'extreme_positive',
        severity: 'medium',
        title: 'Exceptional ROI',
        description: `**${row.mediaBuyer}** exceptional ${row.ROI.toFixed(1)}% ROI with **${row.network} ${row.offer}**`,
        mediaBuyer: row.mediaBuyer,
        network: row.network,
        offer: row.offer,
        impact: row.Margin
      });
    } else {
      anomalies.push({
        type: 'extreme_negative',
        severity: 'high',
        title: 'Severe Loss',
        description: `**${row.mediaBuyer}** severe ${row.ROI.toFixed(1)}% ROI with **${row.network} ${row.offer}**`,
        mediaBuyer: row.mediaBuyer,
        network: row.network,
        offer: row.offer,
        impact: Math.abs(row.Margin)
      });
    }
  });

  // Sort by severity and impact
  return anomalies
    .sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return Math.abs(b.impact) - Math.abs(a.impact);
    })
    .slice(0, 8); // Limit to top 8 anomalies
};

// Performance Anomalies Component
const PerformanceAnomalies = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const anomalies = useMemo(() => detectAnomalies(data), [data]);

  if (anomalies.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-gray-900">No anomalies detected</span>
          <span className="text-xs text-gray-500">• All performance appears normal</span>
        </div>
      </div>
    );
  }

  const getIssueType = (type) => {
    switch (type) {
      case 'underperformer': return 'Underperforming media buyer';
      case 'overperformer': return 'Exceptional performer';
      case 'network_discrepancy': return 'Network discrepancy';
      case 'extreme_positive': return 'Exceptional ROI';
      case 'extreme_negative': return 'Severe loss';
      default: return 'Anomaly';
    }
  };

  const getSeverityColor = (severity, type) => {
    if (type === 'overperformer' || type === 'extreme_positive') {
      return 'text-green-700';
    }
    
    switch (severity) {
      case 'high': return 'text-red-700';
      case 'medium': return 'text-yellow-700';
      default: return 'text-blue-700';
    }
  };

  // Show only top 6 critical anomalies by default, all when expanded
  const displayAnomalies = isExpanded ? anomalies : anomalies.slice(0, 6);
  const hasMore = anomalies.length > 6;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Compact Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-900">Performance Anomalies</h3>
          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            {anomalies.length}
          </span>
        </div>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Show Less' : `+${anomalies.length - 6} More`}
          </button>
        )}
      </div>
      
      {/* Simple List Format */}
      <div className="p-4">
        <div className="space-y-3">
          {displayAnomalies.map((anomaly, index) => {
            const severityColor = getSeverityColor(anomaly.severity, anomaly.type);
            const issueType = getIssueType(anomaly.type);
            
            return (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <span className={`font-bold ${severityColor}`}>{issueType}:</span>
                  <span 
                    className="text-gray-700 ml-2" 
                    dangerouslySetInnerHTML={{ 
                      __html: anomaly.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                    }} 
                  />
                </div>
                <span className={`text-sm font-semibold ml-4 ${anomaly.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(anomaly.impact))}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Quick Summary */}
        {anomalies.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {anomalies.filter(a => a.severity === 'high').length} high priority • 
                {anomalies.filter(a => a.severity === 'medium').length} medium priority
              </span>
              <span>
                Total impact: {formatCurrency(anomalies.reduce((sum, a) => sum + Math.abs(a.impact), 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Highlights = ({ performanceData, dateRange }) => {
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [sortConfig, setSortConfig] = useState({ key: 'Margin', direction: 'desc' });

  // Calculate date range based on selected period
  const calculatedDateRange = useMemo(() => {
    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '365d': 365
    };
    
    const startDate = subDays(now, days[selectedPeriod] || 30);
    return {
      startDate,
      endDate: now
    };
  }, [selectedPeriod]);

  // Use calculated date range or provided one
  const effectiveDateRange = dateRange || calculatedDateRange;

  // Filter data based on date range and active media buyers
  const filteredData = useMemo(() => {
    if (!performanceData?.length) return [];
    
    const activeBuyers = getActiveMediaBuyers(performanceData);

    return performanceData.filter(entry => {
      if (!entry.Date) return false;
      
      // Filter out inactive media buyers
      if (!activeBuyers.includes(entry['Media Buyer'])) {
        return false;
      }
      
      // Parse the date string into a Date object
      let entryDate;
      try {
        // Try parsing as ISO string first
        entryDate = new Date(entry.Date);
        
        // If invalid, try MM/DD/YYYY format
        if (isNaN(entryDate.getTime()) && entry.Date.includes('/')) {
          const [month, day, year] = entry.Date.split('/').map(num => parseInt(num, 10));
          entryDate = new Date(year, month - 1, day);
        }
        
        // If still invalid, try YYYY-MM-DD format
        if (isNaN(entryDate.getTime()) && entry.Date.includes('-')) {
          const [year, month, day] = entry.Date.split('-').map(num => parseInt(num, 10));
          entryDate = new Date(year, month - 1, day);
        }
        
        // Check if the date is valid
        if (isNaN(entryDate.getTime())) {
          console.warn('Invalid date:', entry.Date);
          return false;
        }
        
        // Normalize dates to start/end of day for comparison
        const normalizedEntryDate = startOfDay(entryDate);
        const normalizedStartDate = startOfDay(effectiveDateRange.startDate);
        const normalizedEndDate = endOfDay(effectiveDateRange.endDate);
        
        // Check if the date is within the selected range
        return normalizedEntryDate >= normalizedStartDate && normalizedEntryDate <= normalizedEndDate;
      } catch (error) {
        console.error('Error parsing date:', entry.Date, error);
        return false;
      }
    });
  }, [performanceData, effectiveDateRange]);

  // Get unique buyers and offers (only active ones)
  const { buyers, offers } = useMemo(() => {
    const buyersSet = new Set();
    const offersSet = new Set();
    const activeBuyers = getActiveMediaBuyers(performanceData);

    filteredData.forEach(entry => {
      if (entry['Media Buyer'] && activeBuyers.includes(entry['Media Buyer'])) {
        buyersSet.add(entry['Media Buyer']);
      }
      if (entry.Offer) offersSet.add(entry.Offer);
    });

    return {
      buyers: Array.from(buyersSet).sort(),
      offers: Array.from(offersSet).sort()
    };
  }, [filteredData, performanceData]);

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort data function
  const sortData = (data, sortConfig) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'mediaBuyer':
          aValue = a.mediaBuyer;
          bValue = b.mediaBuyer;
          break;
        case 'network':
          aValue = a.network;
          bValue = b.network;
          break;
        case 'offer':
          aValue = a.offer;
          bValue = b.offer;
          break;
        case 'ROI':
          aValue = a.ROI;
          bValue = b.ROI;
          break;
        case 'Margin':
          aValue = a.Margin;
          bValue = b.Margin;
          break;
        case 'trend':
          // Sort by trend status priority: improving > neutral > volatile
          const trendPriority = { improving: 3, neutral: 2, volatile: 1 };
          aValue = trendPriority[getTrendStatus(a.trendData)] || 0;
          bValue = trendPriority[getTrendStatus(b.trendData)] || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Sort icon component
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return (
      <span className="text-blue-600 ml-1">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Update the data processing to filter active buyers
  const data = useMemo(() => {
    const activeBuyers = getActiveMediaBuyers(performanceData);
    
    // Filter out any invalid rows first
    const validRows = performanceData.filter(row => {
      // Parse the date
      const rowDate = new Date(row.Date);
      
      const isValid = row && 
        typeof row === 'object' && 
        row['Media Buyer'] && 
        activeBuyers.includes(row['Media Buyer']) && // Only include active media buyers
        parseFloat(row['Ad Spend']) > 0 && 
        rowDate >= subDays(new Date(), 30) && // Within date range
        (!selectedBuyer || row['Media Buyer'] === selectedBuyer) && 
        (!selectedOffer || row.Offer === selectedOffer);
      
      return isValid;
    });

    if (validRows.length === 0) {
      return [];
    }

    // Group by Media Buyer and combine EDU offers
    const groupedData = validRows.reduce((acc, row) => {
      // Normalize offer name - combine EDU offers
      const normalizedOffer = row.Offer?.startsWith('EDU') ? 'EDU' : row.Offer;
      
      const key = `${row['Media Buyer']}-${normalizedOffer || 'Unknown'}`;

      if (!acc[key]) {
        acc[key] = {
          mediaBuyer: row['Media Buyer'],
          network: row.Network || 'Unknown',
          offer: normalizedOffer || 'Unknown',
          adSpend: 0,
          revenue: 0,
          trendData: []
        };
      }
      
      // Safely parse numbers
      const adSpend = parseFloat(row['Ad Spend']) || 0;
      const revenue = parseFloat(row['Total Revenue']) || 0;
      
      acc[key].adSpend += adSpend;
      acc[key].revenue += revenue;
      acc[key].trendData.push(revenue);

      return acc;
    }, {});

    // Calculate ROI and Margin
    const processedData = Object.values(groupedData)
      .map(row => ({
        ...row,
        ROI: row.adSpend ? ((row.revenue - row.adSpend) / row.adSpend) * 100 : 0,
        Margin: row.revenue - row.adSpend
      }));

    // Apply sorting
    return sortData(processedData, sortConfig);
  }, [performanceData, selectedBuyer, selectedOffer, sortConfig]);

  // Format date range text
  const dateRangeText = useMemo(() => {
    return `${format(effectiveDateRange.startDate, 'MMM d')} to ${format(effectiveDateRange.endDate, 'MMM d, yyyy')}`;
  }, [effectiveDateRange]);

  // Export functionality
  const handleExport = () => {
    const csvData = [
      ['Media Buyer', 'Network', 'Offer', 'ROI %', 'Margin', 'Revenue', 'Ad Spend'].join(','),
      ...data.map(row => [
        row.mediaBuyer,
        row.network,
        row.offer,
        row.ROI.toFixed(1),
        row.Margin.toFixed(2),
        row.revenue.toFixed(2),
        row.adSpend.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-highlights-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Early return if no data
  if (!performanceData || !Array.isArray(performanceData) || performanceData.length === 0) {
    return (
      <div className="space-y-6" style={{backgroundColor: 'red', padding: '20px'}}>
        <div style={{backgroundColor: 'yellow', padding: '20px', fontSize: '24px', fontWeight: 'bold'}}>
          🚨 TESTING - IF YOU SEE THIS, THE FILE IS WORKING 🚨
        </div>
      </div>
    );
  }

  // If no valid data after processing, show filtered empty state
  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Performance Highlights</h2>
          <div className="flex items-center gap-4">
            <TimePeriodSelector 
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>
        </div>
        
        <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
          <Info className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Matches Current Filters</h3>
          <p className="text-gray-600 mb-4">Try adjusting your buyer or offer filters, or select a different date range.</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setSelectedBuyer(null)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
            >
              Clear Buyer Filter
            </button>
            <button
              onClick={() => setSelectedOffer(null)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
            >
              Clear Offer Filter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Performance Highlights</h2>
          <p className="text-gray-600 mt-1">Campaign performance overview and insights • Active media buyers only</p>
        </div>
        <div className="flex items-center gap-4">
          <TimePeriodSelector 
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
          <div className="text-sm text-gray-500">
            {dateRangeText}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <SummaryStats data={data} />

      {/* NEW: Performance Anomalies Section */}
      <PerformanceAnomalies data={data} />

      {/* Enhanced Filter Buttons */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">Filter by Media Buyer:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedBuyer(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  !selectedBuyer
                    ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                }`}
              >
                All Buyers ({buyers.length})
              </button>
              {buyers.map(buyer => (
                <button
                  key={buyer}
                  onClick={() => setSelectedBuyer(buyer)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    selectedBuyer === buyer
                      ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  {buyer}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">Filter by Offer:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedOffer(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  !selectedOffer
                    ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                }`}
              >
                All Offers ({offers.length})
              </button>
              {offers.map((offer, index) => (
                <button
                  key={`offer-${offer}-${index}`}
                  onClick={() => setSelectedOffer(offer)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    selectedOffer === offer
                      ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  {offer}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Campaign Performance Details</h3>
              <p className="text-sm text-gray-500 mt-1">
                {data.length} campaign combinations • Sorted by {
                  sortConfig.key === 'mediaBuyer' ? 'Media Buyer' :
                  sortConfig.key === 'network' ? 'Network' :
                  sortConfig.key === 'offer' ? 'Offer' :
                  sortConfig.key === 'ROI' ? 'ROI' :
                  sortConfig.key === 'Margin' ? 'Profit Margin' :
                  sortConfig.key === 'trend' ? 'Trend Status' : 'Profit Margin'
                } ({sortConfig.direction === 'asc' ? 'ascending' : 'descending'}) • {dateRangeText} • Active buyers only
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {selectedBuyer && `Buyer: ${selectedBuyer}`}
              {selectedBuyer && selectedOffer && ' • '}
              {selectedOffer && `Offer: ${selectedOffer}`}
            </div>
          </div>
        </div>
        
        {/* CSS Grid Table */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 100px 100px 90px 120px 640px',
          width: '100%',
          overflow: 'auto'
        }}>
          {/* Header Row */}
          <div 
            style={{
              padding: '12px 16px',
              backgroundColor: '#F9FAFB',
              borderBottom: '2px solid #E5E7EB',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onClick={() => handleSort('mediaBuyer')}
          >
            <span>Media Buyer</span>
            <SortIcon column="mediaBuyer" />
          </div>
          <div 
            style={{
              padding: '12px 16px',
              backgroundColor: '#F9FAFB',
              borderBottom: '2px solid #E5E7EB',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onClick={() => handleSort('network')}
          >
            <span>Network</span>
            <SortIcon column="network" />
          </div>
          <div 
            style={{
              padding: '12px 16px',
              backgroundColor: '#F9FAFB',
              borderBottom: '2px solid #E5E7EB',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onClick={() => handleSort('offer')}
          >
            <span>Offer</span>
            <SortIcon column="offer" />
          </div>
          <div 
            style={{
              padding: '12px 16px',
              backgroundColor: '#F9FAFB',
              borderBottom: '2px solid #E5E7EB',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}
            onClick={() => handleSort('ROI')}
          >
            <span>ROI</span>
            <SortIcon column="ROI" />
          </div>
          <div 
            style={{
              padding: '12px 16px',
              backgroundColor: '#F9FAFB',
              borderBottom: '2px solid #E5E7EB',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}
            onClick={() => handleSort('Margin')}
          >
            <span>Margin</span>
            <SortIcon column="Margin" />
          </div>
          <div 
            style={{
              padding: '12px 16px',
              backgroundColor: '#F9FAFB',
              borderBottom: '2px solid #E5E7EB',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onClick={() => handleSort('trend')}
          >
            <span>Trend</span>
            <SortIcon column="trend" />
          </div>

          {/* Data Rows */}
          {data.map((row, index) => (
            <React.Fragment key={index}>
              <div style={{
                padding: '12px 16px',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div className="font-semibold text-gray-900 text-sm">
                  {row.mediaBuyer}
                </div>
              </div>
              <div style={{
                padding: '12px 16px',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div className="text-sm text-blue-600 font-medium">
                  {row.network || 'Unknown'}
                </div>
              </div>
              <div style={{
                padding: '12px 16px',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div className="text-sm text-orange-600 font-medium">
                  {row.offer}
                </div>
              </div>
              <div style={{
                padding: '12px 16px',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
                {row.adSpend > 0 ? <ROIDisplay roi={row.ROI} /> : '—'}
              </div>
              <div style={{
                padding: '12px 16px',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}>
                {row.adSpend > 0 ? <ProfitIndicator value={row.Margin} /> : '—'}
              </div>
              <div style={{
                padding: '12px 16px',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <StatusPill 
                      status={getTrendStatus(row.trendData)} 
                      className="text-xs font-medium px-3 py-2"
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <TrendGraph data={row.trendData} width={280} height={60} />
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Highlights; 