import React, { useMemo, useState } from 'react';
import { HelpCircle, TrendingUp, TrendingDown, CircleDot, Minus, Info, ChevronDown } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import { format, startOfDay, endOfDay } from 'date-fns';

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

const getDateRangeText = (period) => {
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '180d':
      startDate.setDate(now.getDate() - 180);
      break;
    case '365d':
      startDate.setDate(now.getDate() - 365);
      break;
    case 'ytd':
      startDate.setMonth(0, 1);
      break;
    case 'all':
      startDate.setFullYear(2025, 0, 1);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  return `${format(startDate, 'MMM d')} to ${format(now, 'MMM d, yyyy')}`;
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

const TrendGraph = ({ data, width = 100, height = 36 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#F9FAFB] rounded-md p-2 border border-gray-200 w-[100px] h-[36px] flex items-center justify-center">
        <span className="text-gray-400 text-sm">—</span>
      </div>
    );
  }

  // Filter out any NaN or invalid values
  const validData = data.filter(value => typeof value === 'number' && !isNaN(value));
  
  if (validData.length === 0) {
    return (
      <div className="bg-[#F9FAFB] rounded-md p-2 border border-gray-200 w-[100px] h-[36px] flex items-center justify-center">
        <span className="text-gray-400 text-sm">—</span>
      </div>
    );
  }

  const maxValue = Math.max(...validData.map(Math.abs));
  const points = validData.map((value, index) => {
    // Add padding to the x-axis (15% on each side)
    const padding = width * 0.15;
    const availableWidth = width - (padding * 2);
    const x = padding + (index / (validData.length - 1)) * availableWidth;
    const y = height - (value / maxValue) * height;
    return `${x},${y}`;
  }).join(' ');

  const status = getTrendStatus(validData);
  const colors = {
    improving: '#27AE60',
    volatile: '#E67E22',
    new: '#4A90E2',
    neutral: '#95A5A6'
  };

  return (
    <div className="bg-[#F9FAFB] rounded-md p-2 border border-gray-200 w-[140px]">
      <svg width={width} height={height} className="mx-auto">
        <polyline
          points={points}
          fill="none"
          stroke={colors[status]}
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

const TimePeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState('quick');

  const periods = {
    quick: [
      { value: '7d', label: 'Last 7 Days', icon: '📊' },
      { value: '30d', label: 'Last 30 Days', icon: '📊' },
      { value: '90d', label: 'Last 90 Days', icon: '📊' }
    ],
    monthly: [
      { value: '180d', label: 'Last 6 Months', icon: '📅' },
      { value: '365d', label: 'Last 12 Months', icon: '📅' },
      { value: 'ytd', label: 'Year to Date', icon: '📅' }
    ],
    extended: [
      { value: 'all', label: 'All Time', icon: '🗓' }
    ]
  };

  return (
    <div className="space-y-2 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <h3 className="text-lg font-semibold">Reporting Period</h3>
        </div>
        <div className="group relative">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100] delay-200">
            Choose the time window for offer performance data. Default: Last 7 Days.
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Desktop View */}
        <div className="hidden md:block space-y-4">
          {Object.entries(periods).map(([group, options]) => (
            <div key={group} className="space-y-2">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                {group === 'quick' ? 'Quick Select' : group === 'monthly' ? 'Monthly' : 'Extended'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onPeriodChange(option.value)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors hover:bg-gray-50 cursor-pointer ${
                      selectedPeriod === option.value
                        ? 'bg-[#EEF4FF] text-blue-700 font-medium border-l-4 border-[#2563EB]'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border rounded-md hover:bg-gray-50 cursor-pointer"
          >
            <span>{periods[activeGroup].find(p => p.value === selectedPeriod)?.label}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
              {Object.entries(periods).map(([group, options]) => (
                <div key={group} className="p-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {group === 'quick' ? 'Quick Select' : group === 'monthly' ? 'Monthly' : 'Extended'}
                  </div>
                  {options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onPeriodChange(option.value);
                        setActiveGroup(group);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-50 cursor-pointer ${
                        selectedPeriod === option.value
                          ? 'bg-[#EEF4FF] text-blue-700 font-medium border-l-4 border-[#2563EB]'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span>{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 italic pt-2">
        Showing data from {getDateRangeText(selectedPeriod)}
      </p>
    </div>
  );
};

const Highlights = ({ performanceData, dateRange }) => {
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!performanceData?.length) return [];

    return performanceData.filter(entry => {
      if (!entry.Date) return false;
      
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
        const normalizedStartDate = startOfDay(dateRange.startDate);
        const normalizedEndDate = endOfDay(dateRange.endDate);
        
        // Check if the date is within the selected range
        return normalizedEntryDate >= normalizedStartDate && normalizedEntryDate <= normalizedEndDate;
      } catch (error) {
        console.error('Error parsing date:', entry.Date, error);
        return false;
      }
    });
  }, [performanceData, dateRange]);

  // Get unique buyers and offers
  const { buyers, offers } = useMemo(() => {
    const buyersSet = new Set();
    const offersSet = new Set();

    filteredData.forEach(entry => {
      if (entry['Media Buyer']) buyersSet.add(entry['Media Buyer']);
      if (entry.Offer) offersSet.add(entry.Offer);
    });

    return {
      buyers: Array.from(buyersSet).sort(),
      offers: Array.from(offersSet).sort()
    };
  }, [filteredData]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!filteredData.length) return {};

    return filteredData.reduce((acc, entry) => {
      const revenue = parseFloat(entry['Total Revenue'] || 0);
      const spend = parseFloat(entry['Ad Spend'] || 0);
      const profit = revenue - spend;

      return {
        totalRevenue: (acc.totalRevenue || 0) + revenue,
        totalSpend: (acc.totalSpend || 0) + spend,
        totalProfit: (acc.totalProfit || 0) + profit,
        roi: ((acc.totalProfit || 0) + profit) / ((acc.totalSpend || 0) + spend) * 100
      };
    }, {});
  }, [filteredData]);

  // Get daily trends
  const dailyTrends = useMemo(() => {
    if (!filteredData.length) return [];

    const trends = filteredData.reduce((acc, entry) => {
      const date = entry.Date;
      if (!acc[date]) {
        acc[date] = {
          revenue: 0,
          spend: 0,
          profit: 0
        };
      }

      acc[date].revenue += parseFloat(entry['Total Revenue'] || 0);
      acc[date].spend += parseFloat(entry['Ad Spend'] || 0);
      acc[date].profit += parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0);

      return acc;
    }, {});

    return Object.entries(trends)
      .map(([date, data]) => ({
        date,
        ...data
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredData]);

  // Get buyer performance
  const buyerPerformance = useMemo(() => {
    if (!filteredData.length) return [];

    const performance = filteredData.reduce((acc, entry) => {
      const buyer = entry['Media Buyer'];
      if (!acc[buyer]) {
        acc[buyer] = {
          buyer,
          revenue: 0,
          spend: 0,
          profit: 0,
          offers: new Set()
        };
      }

      acc[buyer].revenue += parseFloat(entry['Total Revenue'] || 0);
      acc[buyer].spend += parseFloat(entry['Ad Spend'] || 0);
      acc[buyer].profit += parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0);
      if (entry.Offer) acc[buyer].offers.add(entry.Offer);

      return acc;
    }, {});

    return Object.values(performance)
      .map(data => ({
        ...data,
        offers: Array.from(data.offers),
        roi: data.spend ? (data.profit / data.spend) * 100 : 0
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [filteredData]);

  // Get offer performance
  const offerPerformance = useMemo(() => {
    if (!filteredData.length) return [];

    const performance = filteredData.reduce((acc, entry) => {
      const offer = entry.Offer;
      if (!offer) return acc;

      if (!acc[offer]) {
        acc[offer] = {
          offer,
          revenue: 0,
          spend: 0,
          profit: 0,
          buyers: new Set()
        };
      }

      acc[offer].revenue += parseFloat(entry['Total Revenue'] || 0);
      acc[offer].spend += parseFloat(entry['Ad Spend'] || 0);
      acc[offer].profit += parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0);
      if (entry['Media Buyer']) acc[offer].buyers.add(entry['Media Buyer']);

      return acc;
    }, {});

    return Object.values(performance)
      .map(data => ({
        ...data,
        buyers: Array.from(data.buyers),
        roi: data.spend ? (data.profit / data.spend) * 100 : 0
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [filteredData]);

  // Format date range text
  const dateRangeText = useMemo(() => {
    return `${format(dateRange.startDate, 'MMM d')} to ${format(dateRange.endDate, 'MMM d, yyyy')}`;
  }, [dateRange]);

  // Add detailed debugging
  console.log('Raw performance data length:', performanceData?.length);
  if (performanceData?.length > 0) {
    console.log('First row structure:', {
      keys: Object.keys(performanceData[0]),
      sample: performanceData[0]
    });
  }

  // Early return if no data
  if (!performanceData || !Array.isArray(performanceData) || performanceData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-500">Profitable Buyers</div>
            <div className="text-2xl font-bold text-[#27AE60]">0</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-500">Unprofitable Buyers</div>
            <div className="text-2xl font-bold text-[#E74C3C]">0</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-500">Total Active Buyers</div>
            <div className="text-2xl font-bold text-[#111827]">0</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-gray-500">No performance data available</div>
        </div>
      </div>
    );
  }

  // Calculate period metrics
  const periodMetrics = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Current period (last 30 days)
    const currentPeriod = performanceData.filter(row => {
      const rowDate = new Date(row.Date);
      return rowDate >= thirtyDaysAgo;
    });

    // Previous period (30-60 days ago)
    const previousPeriod = performanceData.filter(row => {
      const rowDate = new Date(row.Date);
      return rowDate >= sixtyDaysAgo && rowDate < thirtyDaysAgo;
    });

    // Calculate metrics for current period
    const currentActiveBuyers = new Set(currentPeriod
      .filter(row => row['Media Buyer'])
      .map(row => row['Media Buyer'])).size;

    // Calculate metrics for previous period
    const previousActiveBuyers = new Set(previousPeriod
      .filter(row => row['Media Buyer'])
      .map(row => row['Media Buyer'])).size;

    // Calculate changes
    const buyerChange = previousActiveBuyers ? 
      ((currentActiveBuyers - previousActiveBuyers) / previousActiveBuyers) * 100 : 0;

    return {
      currentActiveBuyers,
      buyerChange
    };
  }, [performanceData]);

  // Update the data processing in useMemo
  const data = useMemo(() => {
    // Get the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter out any invalid rows first
    const validRows = performanceData.filter(row => {
      // Parse the date
      const rowDate = new Date(row.Date);
      
      const isValid = row && 
        typeof row === 'object' && 
        row['Media Buyer'] && // Must have a media buyer
        parseFloat(row['Ad Spend']) > 0 && // Must have ad spend
        rowDate >= thirtyDaysAgo && // Must be within last 30 days
        (!selectedBuyer || row['Media Buyer'] === selectedBuyer) && // Apply buyer filter
        (!selectedOffer || row.Offer === selectedOffer); // Apply offer filter
      
      if (!isValid) {
        console.log('Invalid row:', row);
      }
      
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
    const finalData = Object.values(groupedData)
          .map(row => ({
            ...row,
        ROI: row.adSpend ? ((row.revenue - row.adSpend) / row.adSpend) * 100 : 0,
        Margin: row.revenue - row.adSpend
      }))
      .sort((a, b) => b.Margin - a.Margin);

    return finalData;
  }, [performanceData, selectedBuyer, selectedOffer]);

  // Update columns with aligned data
  const columns = useMemo(() => [
    {
      header: 'Media Buyer',
      cell: (row) => (
        <div className="font-medium text-[#111827] text-sm min-w-[140px]">
          {row.mediaBuyer}
        </div>
      )
    },
    {
      header: 'Network',
      cell: (row) => (
        <div className="text-sm text-gray-600 min-w-[120px]">
          {row.network || 'Unknown'}
        </div>
      )
    },
    {
      header: 'Offer',
      cell: (row) => (
        <div className="text-sm text-gray-600 min-w-[120px]">
          {row.offer}
        </div>
      )
    },
    {
      header: (
        <div className="flex items-center justify-end gap-1 min-w-[100px]">
          ROI
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100] delay-200">
              Return on Investment: (Revenue - Ad Spend) / Ad Spend
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
            </div>
          </div>
        </div>
      ),
      cell: (row) => (
        <div className="text-right font-medium text-sm">
          {row.adSpend > 0 ? formatPercent(row.ROI) : '—'}
        </div>
      )
    },
    {
      header: (
        <div className="flex items-center justify-end gap-1 min-w-[120px]">
          Margin
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100] delay-200">
              Net Profit: Revenue minus Ad Spend
              <br />
              <br />
              Note: For ACA ACA offers, this includes revenue from:
              <br />
              • ACA ACA
              <br />
              • ACA Suited
              <br />
              • Suited ACA
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
            </div>
          </div>
        </div>
      ),
      cell: (row) => (
        <div className="text-right font-medium text-sm">
          {row.adSpend > 0 ? formatCurrency(row.Margin) : '—'}
        </div>
      )
    },
    {
      header: (
        <div className="min-w-[200px]">
          Trend
        </div>
      ),
      cell: (row) => (
        <div className="flex items-center gap-6">
          <StatusPill 
            status={getTrendStatus(row.trendData)} 
            className="text-[13px] font-medium px-2 py-1"
          />
          <TrendGraph data={row.trendData} />
        </div>
      )
    }
  ], []);

  // If no valid data after processing, show empty state
  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-500">Profitable Buyers</div>
            <div className="text-2xl font-bold text-[#27AE60]">0</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-500">Unprofitable Buyers</div>
            <div className="text-2xl font-bold text-[#E74C3C]">0</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-500">Total Active Buyers</div>
            <div className="text-2xl font-bold text-[#111827]">0</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-gray-500">No valid performance data available</div>
        </div>
      </div>
    );
  }

  // Group data by profitability
  const profitableBuyers = data.filter(row => row.Margin > 0);
  const unprofitableBuyers = data.filter(row => row.Margin <= 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Highlights</h2>
        <div className="text-sm text-gray-500">
          Showing data from {dateRangeText}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#F0F4FF] rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💰</span>
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {formatCurrency(data.reduce((sum, row) => sum + row.revenue, 0))}
          </div>
        </div>
        <div className="bg-[#FFF5F5] rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🧾</span>
            <h3 className="text-sm font-medium text-gray-500">Total Spend</h3>
          </div>
          <div className="text-2xl font-bold text-red-700">
            {formatCurrency(data.reduce((sum, row) => sum + row.adSpend, 0))}
          </div>
        </div>
        <div className="bg-[#F1FBF1] rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📈</span>
            <h3 className="text-sm font-medium text-gray-500">Total Margin</h3>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(data.reduce((sum, row) => sum + row.Margin, 0))}
          </div>
        </div>
        <div className="bg-[#F5F0FF] rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚖️</span>
            <h3 className="text-sm font-medium text-gray-500">Overall ROI</h3>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {(() => {
              const totalRevenue = data.reduce((sum, row) => sum + row.revenue, 0);
              const totalSpend = data.reduce((sum, row) => sum + row.adSpend, 0);
              return totalSpend > 0 ? formatPercent(((totalRevenue - totalSpend) / totalSpend) * 100) : '0%';
            })()}
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedBuyer(null)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-gray-50 cursor-pointer ${
              !selectedBuyer
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Buyers
          </button>
          {buyers.map(buyer => (
            <button
              key={buyer}
              onClick={() => setSelectedBuyer(buyer)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-gray-50 cursor-pointer ${
                selectedBuyer === buyer
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {buyer}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedOffer(null)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-gray-50 cursor-pointer ${
              !selectedOffer
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Offers
          </button>
          {offers.map(offer => (
            <button
              key={offer}
              onClick={() => setSelectedOffer(offer)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-gray-50 cursor-pointer ${
                selectedOffer === offer
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {offer}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Offer Breakdown by Date</h3>
              <p className="text-sm text-gray-500 mt-1">
                Last 30 days performance
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <DataTable
            columns={columns}
            data={data}
            frozenColumns={1}
            showZebra={true}
            className="overflow-hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default Highlights; 