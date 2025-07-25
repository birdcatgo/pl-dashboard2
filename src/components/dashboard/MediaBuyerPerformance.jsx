import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import PerformanceMetrics from './PerformanceMetrics';
import {
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend as RechartsLegend,
  ReferenceLine
} from 'recharts';
import MultiSelect from '../ui/multi-select';
import { TrendingUp, TrendingDown, ArrowRight, Activity, Info } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { Checkbox } from '../ui/checkbox';
import EnhancedDateSelector from './EnhancedDateSelector';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { calculateChange } from '../../utils/calculations';

const MEDIA_BUYERS = [
  'Ishaan',
  'Edwin',
  'Nick N',
  'Mike C',
  'Gagan',
  'Omar',
  'Bikki',
  'Emil',
];

// Add this helper function for row grouping
const groupDataByMediaBuyer = (data) => {
  // First group by media buyer
  const buyerGroups = data.reduce((acc, entry) => {
    const buyer = entry['Media Buyer'];
    if (!acc[buyer]) {
      acc[buyer] = {
        mediaBuyer: buyer,
        revenue: 0,
        spend: 0,
        margin: 0,
        networks: {}
      };
    }
    
    // Add to buyer totals
    acc[buyer].revenue += parseFloat(entry['Total Revenue'] || 0);
    acc[buyer].spend += parseFloat(entry['Ad Spend'] || 0);
    acc[buyer].margin += parseFloat(entry.Margin || 0);
    
    // Group by network within each buyer
    const network = entry.Network;
    if (!acc[buyer].networks[network]) {
      acc[buyer].networks[network] = {
        network,
        revenue: 0,
        spend: 0,
        margin: 0
      };
    }
    
    // Add to network totals
    acc[buyer].networks[network].revenue += parseFloat(entry['Total Revenue'] || 0);
    acc[buyer].networks[network].spend += parseFloat(entry['Ad Spend'] || 0);
    acc[buyer].networks[network].margin += parseFloat(entry.Margin || 0);
    
    return acc;
  }, {});
  
  // Convert to array and sort by revenue
  return Object.values(buyerGroups)
    .sort((a, b) => b.revenue - a.revenue);
};

// Add this helper function for trend analysis
const analyzeTrend = (data, buyer) => {
  // Get buyer's daily margins for the period
  const dailyMargins = data
    .filter(entry => entry['Media Buyer'] === buyer)
    .reduce((acc, entry) => {
      const date = entry.Date;
      if (!acc[date]) acc[date] = 0;
      acc[date] += parseFloat(entry.Margin || 0);
      return acc;
    }, {});

  const margins = Object.values(dailyMargins);
  if (margins.length < 2) return { type: 'insufficient', label: 'Insufficient Data' };

  // Calculate trend
  let increases = 0;
  let decreases = 0;
  let stabilityCount = 0;
  const threshold = 0.1; // 10% change threshold for stability

  for (let i = 1; i < margins.length; i++) {
    const change = (margins[i] - margins[i-1]) / margins[i-1];
    if (Math.abs(change) <= threshold) {
      stabilityCount++;
    } else if (change > threshold) {
      increases++;
    } else {
      decreases++;
    }
  }

  // Calculate overall trend percentage
  const midPoint = Math.floor(margins.length / 2);
  const firstHalf = margins.slice(0, midPoint);
  const secondHalf = margins.slice(midPoint);
  
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  // Handle edge cases
  if (firstHalfAvg === 0) {
    if (secondHalfAvg === 0) {
      return { 
        type: 'stable',
        label: 'Stable',
        color: 'text-blue-600',
        icon: 'horizontal'
      };
    } else {
      return { 
        type: 'improving',
        label: '+100%',
        color: 'text-green-600',
        icon: 'up'
      };
    }
  }

  const trendPercent = ((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100;

  // Determine trend type with percentage
  if (stabilityCount > margins.length * 0.6) {
    return { 
      type: 'stable',
      label: 'Consistent',
      color: 'text-blue-600',
      icon: 'horizontal'
    };
  } else if (increases > decreases * 1.5) {
    return { 
      type: 'improving',
      label: `+${Math.abs(trendPercent).toFixed(1)}%`,
      color: 'text-green-600',
      icon: 'up'
    };
  } else if (decreases > increases * 1.5) {
    return { 
      type: 'declining',
      label: `-${Math.abs(trendPercent).toFixed(1)}%`,
      color: 'text-red-600',
      icon: 'down'
    };
  } else {
    return { 
      type: 'inconsistent',
      label: 'Volatile',
      color: 'text-yellow-600',
      icon: 'volatile'
    };
  }
};

// Add a helper function to format date range
const formatDateRange = (startDate, endDate) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

// Add this new component near the top of the file, after the imports
const TrendGraph = ({ data, color = 'blue' }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const width = 60;
  const height = 20;
  const padding = 2;

  // Normalize data to fit within the graph height
  const normalizedData = data.map(value => {
    if (range === 0) return height / 2; // If all values are the same, draw a horizontal line
    return ((value - min) / range) * (height - padding * 2) + padding;
  });

  // Create SVG path with proper scaling and line commands
  const points = normalizedData.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    return `${x},${height - value}`;
  });

  // Create the SVG path with proper line commands
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point}`;
    return `${path} L ${point}`;
  }, '');

  const colorClasses = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    red: 'stroke-red-500',
    yellow: 'stroke-yellow-500'
  };

  return (
    <svg width={width} height={height} className="ml-2">
      <path
        d={pathData}
        fill="none"
        strokeWidth="1.5"
        className={colorClasses[color]}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const MediaBuyerPerformance = ({ performanceData, dateRange: initialDateRange, commissions = [] }) => {
  const [selectedBuyers, setSelectedBuyers] = useState(['all']);
  const [selectedNetworks, setSelectedNetworks] = useState(['all']);
  const [expandedBuyers, setExpandedBuyers] = useState(new Set());
  const [selectedOffers, setSelectedOffers] = useState(new Set());
  const [isCumulative, setIsCumulative] = useState(false);

  // Helper function to check if a media buyer is active
  const isActiveBuyer = (buyerName) => {
    // Explicitly exclude Edwin
    if (buyerName === 'Edwin') return false;
    
    // Explicitly include Emil as active
    if (buyerName === 'Emil') return true;
    
    if (!commissions.length) return true; // If no commission data, show all
    const commissionEntry = commissions.find(c => 
      c['Media Buyer'] === buyerName || c.mediaBuyer === buyerName
    );
    return commissionEntry?.Status === 'ACTIVE' || commissionEntry?.status === 'ACTIVE';
  };

  const [dateRange, setDateRange] = useState(() => {
    // If initialDateRange is provided, use it
    if (initialDateRange) return initialDateRange;
    
    // Otherwise, default to the most recent 7 days of available data
    if (performanceData?.length) {
      // Get all unique dates from the data and sort them
      const availableDates = [...new Set(performanceData
        .map(entry => entry.Date)
        .filter(Boolean))]
        .map(dateStr => {
          try {
            // Handle MM/DD/YYYY format
            if (dateStr.includes('/')) {
              const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
              return new Date(year, month - 1, day);
            }
            // Handle other formats
            return new Date(dateStr);
          } catch (e) {
            return null;
          }
        })
        .filter(date => date && !isNaN(date.getTime()))
        .sort((a, b) => b - a); // Sort in descending order (newest first)

      if (availableDates.length > 0) {
        const mostRecentDate = availableDates[0];
        // Get dates from the last 7 days of available data
        const last7Days = availableDates.slice(0, 7);
        const oldestInRange = last7Days[last7Days.length - 1] || mostRecentDate;
        
        return {
          startDate: startOfDay(oldestInRange),
          endDate: endOfDay(mostRecentDate),
          period: 'last7'
        };
      }
    }
    
    // Fallback to last 7 days from now if no data
    const now = new Date();
    return {
      startDate: startOfDay(subDays(now, 6)),
      endDate: endOfDay(now),
      period: 'last7'
    };
  });

  // Update internal date range when prop changes
  useEffect(() => {
    if (initialDateRange) {
      setDateRange(initialDateRange);
    }
  }, [initialDateRange]);

  // Update date range when performance data changes to use most recent data
  useEffect(() => {
    if (performanceData?.length && !initialDateRange) {
      // Get all unique dates from the data and sort them
      const availableDates = [...new Set(performanceData
        .map(entry => entry.Date)
        .filter(Boolean))]
        .map(dateStr => {
          try {
            // Handle MM/DD/YYYY format
            if (dateStr.includes('/')) {
              const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
              return new Date(year, month - 1, day);
            }
            // Handle other formats
            return new Date(dateStr);
          } catch (e) {
            return null;
          }
        })
        .filter(date => date && !isNaN(date.getTime()))
        .sort((a, b) => b - a); // Sort in descending order (newest first)

      if (availableDates.length > 0) {
        const mostRecentDate = availableDates[0];
        // Get dates from the last 7 days of available data
        const last7Days = availableDates.slice(0, 7);
        const oldestInRange = last7Days[last7Days.length - 1] || mostRecentDate;
        
        setDateRange({
          startDate: startOfDay(oldestInRange),
          endDate: endOfDay(mostRecentDate),
          period: 'last7'
        });
      }
    }
  }, [performanceData, initialDateRange]);

  // First filter data by date range - Optimize the date comparison
  const filteredByDate = useMemo(() => {
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

  // Handle date range changes
  const handleDateRangeChange = (newDateRange) => {
    console.log('Date range changed in MediaBuyerPerformance:', newDateRange);
    setDateRange(newDateRange);
  };

  // Add error boundary for data processing
  const processedData = useMemo(() => {
    try {
      if (!filteredByDate.length) return { buyerMetrics: [], buyerOptions: ['all'] };

      // Pre-calculate field names to avoid repeated lookups
      const buyerData = new Map();
      const buyerOptions = new Set(['all']);

      // Single pass through the data
      filteredByDate.forEach(row => {
        try {
          const buyer = row['Media Buyer'] || 'Unknown';
          
          // Skip inactive buyers
          if (!isActiveBuyer(buyer)) return;
          
          buyerOptions.add(buyer);

          let buyerMetrics = buyerData.get(buyer);
          if (!buyerMetrics) {
            buyerMetrics = {
              name: buyer,
              spend: 0,
              revenue: 0,
              margin: 0,
              networkData: new Map()
            };
            buyerData.set(buyer, buyerMetrics);
          }

          const spend = parseFloat(row['Ad Spend'] || 0);
          const revenue = parseFloat(row['Total Revenue'] || 0);
          const margin = revenue - spend;

          buyerMetrics.spend += spend;
          buyerMetrics.revenue += revenue;
          buyerMetrics.margin += margin;

          const network = row.Network;
          const offer = row.Offer;
          const networkOffer = network && offer ? `${network} - ${offer}` : (network || 'Unknown');
          
          if (networkOffer) {
            let networkMetrics = buyerMetrics.networkData.get(networkOffer);
            if (!networkMetrics) {
              networkMetrics = { spend: 0, revenue: 0, margin: 0 };
              buyerMetrics.networkData.set(networkOffer, networkMetrics);
            }
            networkMetrics.spend += spend;
            networkMetrics.revenue += revenue;
            networkMetrics.margin += margin;
          }
        } catch (error) {
          console.error('Error processing row:', error, row);
        }
      });

      // Convert Map to array and calculate final metrics
      const buyerMetrics = Array.from(buyerData.values()).map(metrics => ({
        ...metrics,
        roi: metrics.spend ? ((metrics.revenue / metrics.spend) - 1) * 100 : 0,
        networkData: Object.fromEntries(metrics.networkData)
      }));

      // Sort by margin descending
      buyerMetrics.sort((a, b) => b.margin - a.margin);

      return {
        buyerMetrics,
        buyerOptions: Array.from(buyerOptions)
      };
    } catch (error) {
      console.error('Error in processedData:', error);
      return { buyerMetrics: [], buyerOptions: ['all'] };
    }
  }, [filteredByDate]);

  // Debug logging
  console.log('MediaBuyerPerformance state:', {
    dateRange,
    totalData: performanceData?.length,
    filteredData: filteredByDate.length,
    processedMetrics: processedData.buyerMetrics.length
  });

  // Get unique buyers and networks
  const { buyers, networks } = useMemo(() => {
    const buyersMap = new Map();
    const networksSet = new Set();
    
    // First pass: calculate total revenue for each buyer
    performanceData?.forEach(entry => {
      if (entry['Media Buyer'] && isActiveBuyer(entry['Media Buyer'])) {
        const revenue = parseFloat(entry['Total Revenue'] || 0);
        buyersMap.set(
          entry['Media Buyer'], 
          (buyersMap.get(entry['Media Buyer']) || 0) + revenue
        );
      }
      if (entry.Network) networksSet.add(entry.Network);
    });

    // Convert to array and sort by revenue
    const sortedBuyers = Array.from(buyersMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([buyer]) => buyer);
    
    return {
      buyers: ['all', ...sortedBuyers],
      networks: ['all', ...Array.from(networksSet)]
    };
  }, [performanceData, commissions]);

  // Add this useEffect to debug date issues
  useEffect(() => {
    if (performanceData?.length) {
      const dates = performanceData
        .map(entry => entry.Date)
        .filter(Boolean)
        .map(date => {
          const [month, day, year] = date.split('/').map(num => parseInt(num, 10));
          return new Date(year, month - 1, day);
        })
        .sort((a, b) => b - a);

      console.log('Available Dates:', {
        latest: dates[0]?.toISOString(),
        earliest: dates[dates.length - 1]?.toISOString(),
        totalDates: dates.length,
        sampleDates: dates.slice(0, 3).map(d => d.toISOString())
      });
    }
  }, [performanceData]);

  // Add a useEffect to log the filtered results
  useEffect(() => {
    console.log('Filtered Data Results:', {
      totalRecords: filteredByDate.length,
      dateRange: {
        start: dateRange.startDate,
        end: dateRange.endDate
      },
      sampleDates: filteredByDate.slice(0, 5).map(d => d.Date)
    });
  }, [filteredByDate, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!filteredByDate.length) return {};

    return filteredByDate.reduce((acc, entry) => ({
      totalRevenue: (acc.totalRevenue || 0) + parseFloat(entry['Total Revenue'] || 0),
      totalSpend: (acc.totalSpend || 0) + parseFloat(entry['Ad Spend'] || 0),
      totalMargin: (acc.totalMargin || 0) + parseFloat(entry.Margin || 0),
      roi: ((acc.totalMargin || 0) / (acc.totalSpend || 1)) * 100
    }), {});
  }, [filteredByDate]);

  const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

  // Prepare chart data with proper date sorting
  const chartData = useMemo(() => {
    if (!filteredByDate.length) return [];

    // Only process data for selected buyers
    const relevantBuyers = selectedBuyers.includes('all') 
      ? processedData.buyerOptions.filter(buyer => buyer !== 'all' && isActiveBuyer(buyer))
      : selectedBuyers.filter(buyer => isActiveBuyer(buyer));

    // Group data by date and offer for each buyer
    const dailyData = filteredByDate.reduce((acc, entry) => {
      if (!relevantBuyers.includes(entry['Media Buyer'])) return acc;

      const date = new Date(entry.Date).toISOString().split('T')[0];
      const buyerOffer = `${entry['Media Buyer']} - ${entry.Offer}`;
      
      if (!acc[date]) {
        acc[date] = {
          date,
          displayDate: new Date(entry.Date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
        };
      }
      
      if (!acc[date][buyerOffer]) {
        acc[date][buyerOffer] = 0;
      }
      
      // Calculate margin instead of using revenue
      const revenue = parseFloat(entry['Total Revenue'] || 0);
      const spend = parseFloat(entry['Ad Spend'] || 0);
      acc[date][buyerOffer] += revenue - spend;
      return acc;
    }, {});

    // Sort dates in ascending order
    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredByDate, selectedBuyers, processedData.buyerOptions]);

  // Get unique buyer-offer combinations for the graph
  const buyerOfferCombos = useMemo(() => {
    if (!filteredByDate.length) return [];

    const relevantBuyers = selectedBuyers.includes('all') 
      ? processedData.buyerOptions.filter(buyer => buyer !== 'all' && isActiveBuyer(buyer))
      : selectedBuyers.filter(buyer => isActiveBuyer(buyer));

    return [...new Set(filteredByDate
      .filter(entry => relevantBuyers.includes(entry['Media Buyer']))
      .map(entry => `${entry['Media Buyer']} - ${entry.Offer}`)
    )];
  }, [filteredByDate, selectedBuyers, processedData.buyerOptions]);

  // Generate colors for each buyer-offer combination
  const colorScale = useMemo(() => {
    return buyerOfferCombos.reduce((acc, combo, index) => {
      const hue = (index * 137.508) % 360; // Golden ratio for color distribution
      acc[combo] = `hsl(${hue}, 70%, 50%)`;
      return acc;
    }, {});
  }, [buyerOfferCombos]);

  // Process data for the profit graph with proper date sorting
  const profitChartData = useMemo(() => {
    if (!filteredByDate.length) return null;

    // Get unique dates and sort them
    const dates = [...new Set(filteredByDate.map(item => {
      const [month, day, year] = item.Date.split('/');
      return new Date(year, month - 1, day).toISOString().split('T')[0];
    }))].sort();

    const mediaBuyers = [...new Set(filteredByDate
      .filter(item => isActiveBuyer(item['Media Buyer']))
      .map(item => item['Media Buyer']))];
    const colors = mediaBuyers.map((_, index) => {
      const hue = (index * 137.508) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    });

    // Create datasets for each media buyer
    const datasets = mediaBuyers.map((buyer, index) => {
      let runningTotal = 0;
      const data = dates.map(date => {
        const dayData = filteredByDate.filter(item => {
          const itemDate = new Date(item.Date);
          const compareDate = new Date(date);
          return itemDate.toISOString().split('T')[0] === date && 
                 item['Media Buyer'] === buyer;
        });
        
        const dailyTotal = dayData.reduce((sum, item) => 
          sum + (parseFloat(item.Margin) || 0), 0
        );

        if (isCumulative) {
          runningTotal += dailyTotal;
          return runningTotal;
        }
        return dailyTotal;
      });

      return {
        label: buyer,
        data,
        borderColor: colors[index],
        backgroundColor: colors[index] + '20',
        tension: 0.4,
        fill: false
      };
    });

    const formattedLabels = dates.map(date => 
      new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    );

    return {
      labels: formattedLabels,
      datasets
    };
  }, [filteredByDate, isCumulative]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        align: 'start'
      },
      title: {
        display: true,
        text: [
          'Daily Profit by Media Buyer',
          `Period: ${formatDateRange(dateRange.startDate, dateRange.endDate)}`
        ],
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatCurrency(value)
        },
        title: {
          display: true,
          text: 'Profit'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  const toggleRow = (mediaBuyer) => {
    const newExpanded = new Set(expandedBuyers);
    if (newExpanded.has(mediaBuyer)) {
      newExpanded.delete(mediaBuyer);
    } else {
      newExpanded.add(mediaBuyer);
    }
    setExpandedBuyers(newExpanded);
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

  // Initialize selected offers when buyer-offer combos change
  useEffect(() => {
    setSelectedOffers(new Set(buyerOfferCombos));
  }, [buyerOfferCombos]);

  const getPerformanceColors = (profit, spend) => {
    const isProfit = profit > 0;
    const isBreakEven = Math.abs(profit) < spend * 0.05; // Within ±5% of spend
    
    return {
      row: isProfit ? 'bg-green-50 hover:bg-green-100' : 
           isBreakEven ? 'bg-yellow-50 hover:bg-yellow-100' : 
           'bg-red-50 hover:bg-red-100',
      text: isProfit ? 'text-green-600' : 
            isBreakEven ? 'text-yellow-600' : 
            'text-red-600',
      icon: isProfit ? '↑' : 
            isBreakEven ? '→' : 
            '↓'
    };
  };

  // Add this helper function near the top of the file
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

  // Helper function to toggle offer selection
  const toggleOfferSelection = (combo) => {
    const newSelected = new Set(selectedOffers);
    if (newSelected.has(combo)) {
      newSelected.delete(combo);
    } else {
      newSelected.add(combo);
    }
    setSelectedOffers(newSelected);
  };

  if (!performanceData?.length) {
    return (
      <Card>
        <div className="p-6">
          <p className="text-gray-500">No media buyer performance data available for the selected date range</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Slack Report Button */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center mb-6">
        <div>
          <h3 className="font-medium text-green-800">Media Buyer Performance Report</h3>
          <p className="text-sm text-green-700">Generate and send media buyer performance data to Slack, including top and underperforming buyers.</p>
        </div>
        <button
          onClick={async () => {
            try {
              // Calculate media buyer performance metrics
              const buyerData = {};
              filteredByDate.forEach(entry => {
                const buyer = entry['Media Buyer'] || 'Unknown';
                if (!buyerData[buyer]) {
                  buyerData[buyer] = {
                    name: buyer,
                    revenue: 0,
                    spend: 0,
                    profit: 0,
                    roi: 0
                  };
                }
                
                buyerData[buyer].revenue += parseFloat(entry['Total Revenue']) || 0;
                buyerData[buyer].spend += parseFloat(entry['Ad Spend']) || 0;
              });
              
              // Calculate profit and ROI for each buyer
              Object.values(buyerData).forEach(buyer => {
                buyer.profit = buyer.revenue - buyer.spend;
                buyer.roi = buyer.spend > 0 ? ((buyer.profit / buyer.spend) * 100).toFixed(2) : 0;
              });
              
              // Sort buyers by profit and get ALL buyers, not just top/bottom 5
              const sortedBuyers = Object.values(buyerData).sort((a, b) => b.profit - a.profit);
              // Get top and bottom 5 for summary section
              const topBuyers = sortedBuyers.slice(0, 5);
              const strugglingBuyers = [...sortedBuyers].sort((a, b) => a.profit - b.profit).slice(0, 5);
              
              // Calculate overall metrics
              const totalRevenue = Object.values(buyerData).reduce((sum, buyer) => sum + buyer.revenue, 0);
              const totalSpend = Object.values(buyerData).reduce((sum, buyer) => sum + buyer.spend, 0);
              const totalProfit = totalRevenue - totalSpend;
              
              // Format date range for message
              const formattedDateRange = formatDateRange(dateRange.startDate, dateRange.endDate);
              
              // Prepare report data
              const reportData = {
                type: 'weekly-performance',
                data: {
                  topBuyers,
                  strugglingBuyers,
                  allBuyers: sortedBuyers, // Include ALL buyers
                  totalProfit,
                  totalRevenue,
                  totalSpend,
                  dateRange: formattedDateRange
                }
              };
              
              console.log('Sending media buyer performance report to Slack:', reportData);
              
              // Send to backend
              const response = await fetch('/api/slack-notification', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
              });
              
              if (!response.ok) {
                throw new Error(`Failed to send report: ${response.status} ${response.statusText}`);
              }
              
              const result = await response.json();
              console.log('Slack notification result:', result);
              
              // Show success message
              alert("Media buyer performance report sent to Slack successfully!");
              
            } catch (error) {
              console.error('Error sending media buyer performance report:', error);
              alert(`Failed to send report: ${error.message}`);
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Send to Slack
        </button>
      </div>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50">
          <div className="p-6">
            <div className="text-sm text-blue-600">Total Revenue</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(processedData.buyerMetrics
                .filter(buyer => isActiveBuyer(buyer.name))
                .reduce((sum, buyer) => sum + buyer.revenue, 0))}
            </div>
          </div>
        </Card>
        
        <Card className="bg-red-50/50">
          <div className="p-6">
            <div className="text-sm text-red-600">Total Spend</div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(processedData.buyerMetrics
                .filter(buyer => isActiveBuyer(buyer.name))
                .reduce((sum, buyer) => sum + buyer.spend, 0))}
            </div>
          </div>
        </Card>
        
        <Card className="bg-green-50/50">
          <div className="p-6">
            <div className="text-sm text-green-600">Total Margin</div>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(processedData.buyerMetrics
                .filter(buyer => isActiveBuyer(buyer.name))
                .reduce((sum, buyer) => sum + buyer.margin, 0))}
            </div>
          </div>
        </Card>
        
        <Card className="bg-purple-50/50">
          <div className="p-6">
            <div className="text-sm text-purple-600">ROI</div>
            <div className="text-2xl font-bold text-purple-700">
              {(() => {
                const activeBuyers = processedData.buyerMetrics.filter(buyer => isActiveBuyer(buyer.name));
                const totalMargin = activeBuyers.reduce((sum, buyer) => sum + buyer.margin, 0);
                const totalSpend = activeBuyers.reduce((sum, buyer) => sum + buyer.spend, 0);
                return ((totalMargin / totalSpend) * 100).toFixed(1);
              })()}%
            </div>
          </div>
        </Card>
      </div>

      {/* Top Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top Performers Card */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold">🏆 Active Media Buyers</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {dateRange.startDate && dateRange.endDate ? 
              `${new Date(dateRange.startDate).toLocaleDateString('en-US')} - ${new Date(dateRange.endDate).toLocaleDateString('en-US')}` 
              : 'All Time'}
          </div>
          <div className="space-y-2">
            {processedData.buyerMetrics
              .filter(buyer => {
                // Filter out unknown buyers
                if (buyer.name === 'Unknown' || buyer.name === 'unknown') return false;
                
                // Use helper function to check if buyer is active
                return isActiveBuyer(buyer.name);
              })
              .sort((a, b) => b.margin - a.margin)
              .map((buyer, index) => {
                const consistency = analyzeTrend(filteredByDate, buyer.name);
                // Get daily margins for the trend graph
                const dailyMargins = filteredByDate
                  .filter(entry => entry['Media Buyer'] === buyer.name)
                  .reduce((acc, entry) => {
                    const date = entry.Date;
                    if (!acc[date]) acc[date] = 0;
                    // Calculate margin as revenue minus spend
                    const revenue = parseFloat(entry['Total Revenue'] || 0);
                    const spend = parseFloat(entry['Ad Spend'] || 0);
                    acc[date] += revenue - spend;
                    return acc;
                  }, {});
                const marginData = Object.values(dailyMargins);

                return (
                  <div key={buyer.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {index === 0 ? '🥇' : 
                         index === 1 ? '🥈' : 
                         index === 2 ? '🥉' : 
                         index < 10 ? `${index + 1}️⃣` : '📊'}
                      </span>
                      <div>
                        <div className="font-semibold text-sm">{buyer.name}</div>
                        <div className="text-xs text-gray-500">ROI: {buyer.roi.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">{formatCurrency(buyer.margin)}</div>
                      <div className="flex items-center justify-end">
                        <TrendGraph 
                          data={marginData} 
                          color={consistency.type === 'stable' ? 'blue' : 
                                 consistency.type === 'improving' ? 'green' : 
                                 consistency.type === 'declining' ? 'red' : 'yellow'} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Top Network-Offer Combinations Card */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold">🎯 Top Network Offers</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {dateRange.startDate && dateRange.endDate ? 
              `${new Date(dateRange.startDate).toLocaleDateString('en-US')} - ${new Date(dateRange.endDate).toLocaleDateString('en-US')}` 
              : 'All Time'}
          </div>
          <div className="space-y-4">
            {Object.values(
              filteredByDate
                .reduce((acc, entry) => {
                  // Skip unknown media buyers and inactive buyers
                  if (entry['Media Buyer']?.toLowerCase() === 'unknown' || !isActiveBuyer(entry['Media Buyer'])) return acc;

                  let network = entry.Network;
                  let mediaBuyer = entry['Media Buyer'];
                  let offer = entry.Offer;
                  
                  // Create a unique key for each network-offer combination
                  const key = `${mediaBuyer} - ${network} - ${offer}`;
                  
                  if (!acc[key]) {
                    acc[key] = {
                      mediaBuyer,
                      network,
                      offer,
                      revenue: 0,
                      spend: 0,
                      margin: 0,
                      dates: new Set()
                    };
                  }

                  // Store the date for trend analysis
                  acc[key].dates.add(entry.Date);
                  
                  acc[key].revenue += parseFloat(entry['Total Revenue'] || 0);
                  acc[key].spend += parseFloat(entry['Ad Spend'] || 0);
                  acc[key].margin = acc[key].revenue - acc[key].spend;
                  acc[key].roi = acc[key].spend > 0 ? (acc[key].margin / acc[key].spend) * 100 : 0;
                  return acc;
                }, {})
            )
              .sort((a, b) => b.margin - a.margin)
              .slice(0, 7)
              .map((combo, index) => {
                // Calculate trend
                const dates = Array.from(combo.dates).sort();
                const midPoint = Math.floor(dates.length / 2);
                const firstHalf = dates.slice(0, midPoint);
                const secondHalf = dates.slice(midPoint);
                
                let trend = {
                  label: 'Stable',
                  color: 'text-gray-500'
                };

                if (firstHalf.length > 0 && secondHalf.length > 0) {
                  const firstHalfMargin = firstHalf.reduce((sum, date) => {
                    const entry = filteredByDate.find(e => 
                      e.Date === date && 
                      e.Network === combo.network &&
                      e.Offer === combo.offer &&
                      e['Media Buyer'] === combo.mediaBuyer
                    );
                    return sum + (entry ? parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0) : 0);
                  }, 0);

                  const secondHalfMargin = secondHalf.reduce((sum, date) => {
                    const entry = filteredByDate.find(e => 
                      e.Date === date && 
                      e.Network === combo.network &&
                      e.Offer === combo.offer &&
                      e['Media Buyer'] === combo.mediaBuyer
                    );
                    return sum + (entry ? parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0) : 0);
                  }, 0);

                  const growth = ((secondHalfMargin - firstHalfMargin) / Math.abs(firstHalfMargin)) * 100;
                  
                  if (growth > 10) {
                    trend = { label: `+${growth.toFixed(1)}%`, color: 'text-green-500' };
                  } else if (growth < -10) {
                    trend = { label: `${growth.toFixed(1)}%`, color: 'text-red-500' };
                  } else {
                    trend = { label: 'Flat', color: 'text-gray-500' };
                  }
                }

                return (
                  <div key={`${combo.mediaBuyer}-${combo.network}-${combo.offer}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣'][index]}</span>
                      <div>
                        <div className="font-semibold text-sm">{combo.mediaBuyer}</div>
                        <div className="text-xs text-gray-600">{combo.network} - {combo.offer}</div>
                        <div className="text-xs text-gray-500">ROI: {combo.roi.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">{formatCurrency(combo.margin)}</div>
                      <div className="flex items-center justify-end">
                        <TrendGraph 
                          data={Array.from(combo.dates).sort().map(date => {
                            const entry = filteredByDate.find(e => 
                              e.Date === date && 
                              e.Network === combo.network &&
                              e.Offer === combo.offer &&
                              e['Media Buyer'] === combo.mediaBuyer
                            );
                            return entry ? parseFloat(entry['Total Revenue'] || 0) - parseFloat(entry['Ad Spend'] || 0) : 0;
                          })}
                          color={trend.label.includes('+') ? 'green' : 
                                 trend.label.includes('-') ? 'red' : 
                                 'blue'} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Media Buyer Performance</h2>
              <MultiSelect
                options={processedData.buyerOptions}
                selected={selectedBuyers}
                onChange={setSelectedBuyers}
                placeholder="Select Media Buyers"
              />
            </div>
            <div className="text-sm text-gray-500">
              {dateRange.startDate && dateRange.endDate ? 
                `${new Date(dateRange.startDate).toLocaleDateString('en-US')} - ${new Date(dateRange.endDate).toLocaleDateString('en-US')}` 
                : 'All Time'}
            </div>
          </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media Buyer
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spend
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50" title="10% of Margin">
                  MB Comm
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50" title="2% of Revenue for ACA entries, deducted from MB Commission">
                  Ringba
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50" title="Margin minus MB Commission minus Ringba Costs">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.buyerMetrics
                .filter(buyer => (selectedBuyers.includes('all') || selectedBuyers.includes(buyer.name)) && 
                               buyer.name.toLowerCase() !== 'unknown' && isActiveBuyer(buyer.name))
                .map((buyer) => {
                  // Get commission rate for this buyer
                  const getCommissionRate = (buyerName) => {
                    if (!buyerName) return 0.10;
                    const commissionObj = commissions.find(
                      c => c.mediaBuyer && c.mediaBuyer.trim().toLowerCase() === buyerName.trim().toLowerCase()
                    );
                    if (commissionObj && typeof commissionObj.commissionRate === 'number' && !isNaN(commissionObj.commissionRate)) {
                      return commissionObj.commissionRate;
                    }
                    return 0.10;
                  };
                  const commissionRate = getCommissionRate(buyer.name);
                  const commission = buyer.margin > 0 ? buyer.margin * commissionRate : 0;
                  // Calculate total Ringba costs from all ACA networks (2% of Revenue)
                  const ringbaCosts = Object.entries(buyer.networkData)
                    .reduce((total, [network, data]) => {
                      if (network.includes('ACA')) {
                        return total + (data.revenue * 0.02);
                      }
                      return total;
                    }, 0);
                  const adjustedCommission = Math.max(0, commission - ringbaCosts);
                  const updatedProfit = buyer.margin - adjustedCommission;
                  const colors = getPerformanceColors(updatedProfit, buyer.spend);
                  const showCommission = buyer.margin > 0;
                  
                  return (
                    <React.Fragment key={buyer.name}>
                      <tr 
                        className={colors.row}
                        onClick={() => toggleBuyerExpansion(buyer.name)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                          <span className="mr-2">
                            {expandedBuyers.has(buyer.name) ? '▼' : '▶'}
                          </span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{buyer.name}</span>
                            {/* Profitability indicator */}
                            <span className={`ml-2 w-2 h-2 rounded-full ${buyer.margin > 0 ? 'bg-green-500' : 'bg-red-500'}`} title={buyer.margin > 0 ? 'Profitable' : 'Unprofitable'}></span>
                            {buyer.name.includes('ACA') && (
                              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                ACA
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(buyer.spend)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(buyer.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(buyer.margin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {buyer.roi.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right bg-blue-50">
                          {showCommission ? formatCurrency(commission) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right bg-blue-50">
                          {showCommission ? formatCurrency(ringbaCosts) : '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right bg-blue-50 ${colors.text} font-medium`}>
                          {showCommission ? formatCurrency(updatedProfit) : '-'}
                        </td>
                      </tr>
                      {expandedBuyers.has(buyer.name) && Object.entries(buyer.networkData).map(([network, data]) => {
                        // Use the same commission rate for the network breakdown
                        const networkCommission = data.margin > 0 ? data.margin * commissionRate : 0;
                        const networkRingbaCosts = network.includes('ACA') ? data.revenue * 0.02 : 0;
                        const networkAdjustedCommission = Math.max(0, networkCommission - networkRingbaCosts);
                        const networkUpdatedProfit = data.margin - networkAdjustedCommission;
                        const showNetworkCommission = data.margin > 0;
                        return (
                          <tr key={`${buyer.name}-${network}`} className="bg-gray-50">
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-gray-500 pl-12 flex items-center">
                              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${data.margin > 0 ? 'bg-green-400' : 'bg-red-400'}`} title={data.margin > 0 ? 'Profitable' : 'Unprofitable'}></span>
                              {network}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500">
                              {formatCurrency(data.spend)}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500">
                              {formatCurrency(data.revenue)}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500">
                              {formatCurrency(data.margin)}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500">
                              {formatPercent(data.spend ? ((data.revenue / data.spend) - 1) * 100 : 0)}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500 bg-blue-50/50">
                              {showNetworkCommission ? formatCurrency(networkCommission) : '-'}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500 bg-blue-50/50">
                              {showNetworkCommission ? formatCurrency(networkRingbaCosts) : '-'}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-xs text-right text-gray-500 bg-blue-50/50">
                              {showNetworkCommission ? formatCurrency(networkUpdatedProfit) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      </Card>

      {/* Performance Chart */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-6">
            {selectedBuyers.includes('all') 
              ? 'Performance Summary (All Active Media Buyers)'
              : `Performance Summary (${selectedBuyers.filter(b => isActiveBuyer(b)).join(', ')})`}
          </h3>

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="text-green-800 text-sm font-medium">Total Profit</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(filteredByDate.reduce((sum, entry) => {
                  if (!selectedBuyers.includes('all') && !selectedBuyers.includes(entry['Media Buyer'])) return sum;
                  if (!isActiveBuyer(entry['Media Buyer'])) return sum;
                  const revenue = parseFloat(entry['Total Revenue'] || 0);
                  const spend = parseFloat(entry['Ad Spend'] || 0);
                  return sum + (revenue - spend);
                }, 0))}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-800 text-sm font-medium">Total Spend</div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(filteredByDate.reduce((sum, entry) => {
                  if (!selectedBuyers.includes('all') && !selectedBuyers.includes(entry['Media Buyer'])) return sum;
                  if (!isActiveBuyer(entry['Media Buyer'])) return sum;
                  return sum + parseFloat(entry['Ad Spend'] || 0);
                }, 0))}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-800 text-sm font-medium">Active Campaigns</div>
              <div className="text-2xl font-bold text-purple-900">
                {new Set(filteredByDate
                  .filter(entry => {
                    if (!selectedBuyers.includes('all') && !selectedBuyers.includes(entry['Media Buyer'])) return false;
                    return isActiveBuyer(entry['Media Buyer']) && parseFloat(entry['Ad Spend'] || 0) > 0;
                  })
                  .map(entry => `${entry['Media Buyer']}-${entry.Offer}`)
                ).size}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="text-orange-800 text-sm font-medium">Average ROI</div>
              <div className="text-2xl font-bold text-orange-900">
                {(() => {
                  const totalSpend = filteredByDate.reduce((sum, entry) => {
                    if (!selectedBuyers.includes('all') && !selectedBuyers.includes(entry['Media Buyer'])) return sum;
                    if (!isActiveBuyer(entry['Media Buyer'])) return sum;
                    return sum + parseFloat(entry['Ad Spend'] || 0);
                  }, 0);
                  const totalProfit = filteredByDate.reduce((sum, entry) => {
                    if (!selectedBuyers.includes('all') && !selectedBuyers.includes(entry['Media Buyer'])) return sum;
                    if (!isActiveBuyer(entry['Media Buyer'])) return sum;
                    const revenue = parseFloat(entry['Total Revenue'] || 0);
                    const spend = parseFloat(entry['Ad Spend'] || 0);
                    return sum + (revenue - spend);
                  }, 0);
                  const avgROI = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
                  return `${avgROI.toFixed(1)}%`;
                })()}
              </div>
            </div>
          </div>

          {/* Top Performing Campaigns */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-semibold mb-4 text-gray-800">🏆 Top Performing Campaigns</h4>
            <div className="space-y-2">
              {(() => {
                const campaignPerformance = filteredByDate
                  .filter(entry => {
                    if (!selectedBuyers.includes('all') && !selectedBuyers.includes(entry['Media Buyer'])) return false;
                    return isActiveBuyer(entry['Media Buyer']);
                  })
                  .reduce((acc, entry) => {
                    const key = `${entry['Media Buyer']} - ${entry.Offer}`;
                    if (!acc[key]) {
                      acc[key] = { spend: 0, revenue: 0, margin: 0 };
                    }
                    const spend = parseFloat(entry['Ad Spend'] || 0);
                    const revenue = parseFloat(entry['Total Revenue'] || 0);
                    acc[key].spend += spend;
                    acc[key].revenue += revenue;
                    acc[key].margin += (revenue - spend);
                    return acc;
                  }, {});

                return Object.entries(campaignPerformance)
                  .map(([campaign, data]) => ({
                    campaign,
                    ...data,
                    roi: data.spend > 0 ? (data.margin / data.spend) * 100 : 0
                  }))
                  .sort((a, b) => b.margin - a.margin)
                  .slice(0, 5)
                  .map((campaign, index) => (
                    <div key={campaign.campaign} className="flex justify-between items-center p-3 bg-white rounded-md border">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">{campaign.campaign}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`text-sm font-medium ${campaign.margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(campaign.margin)}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          campaign.roi > 20 ? 'bg-green-100 text-green-800' :
                          campaign.roi > 0 ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {campaign.roi.toFixed(1)}% ROI
                        </span>
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const formatPercent = (value) => {
  return `${value.toFixed(1)}%`;
};

export default MediaBuyerPerformance;